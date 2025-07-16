import { Injectable, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ClientService } from '../../modules/client/client.service';
import { Server, ServerOptions } from 'socket.io';
import { LoggerService } from '../logger/logger.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthenticatedSocketAdapter extends IoAdapter implements OnModuleInit {
    private allowedOrigins: string[] = [];
    private serverInstance: Server | null = null;
    
    constructor(
        private readonly adapterHost: HttpAdapterHost,
        private readonly redisService: RedisService,
        private readonly logger: LoggerService,
        @Inject(forwardRef(() => ClientService))
        private readonly clientService: ClientService,
    ) {
        // Get the HTTP server from the adapter host and pass it to the IoAdapter
        const httpServer = adapterHost.httpAdapter.getHttpServer();
        super(httpServer);
        
        // Debug info about the HTTP server
        this.logger.socket(`HTTP Server type: ${httpServer ? typeof httpServer : 'undefined'}`);
    }
    
    /**
     * Initialize allowed origins when the module is ready
     */
    async onModuleInit() {
        await this.refreshAllowedOrigins();
    }
    
    /**
     * Fetch all active client URLs from the database and set them as allowed origins
     */
    async refreshAllowedOrigins() {
        try {
            const activeClients = await this.clientService.getActiveClients();
            const origins = activeClients.map(client => client.clientUrl);
            
            this.logger.socket(`Found ${origins.length} active client URLs to set as allowed origins`);
            this.setAllowedOrigins(origins);
            
            return origins;
        } catch (error) {
            this.logger.error('Failed to refresh allowed origins', error.stack, 'Socket');
            return [];
        }
    }
    
    /**
     * Set allowed origins for CORS
     */
    setAllowedOrigins(origins: string[]) {
        this.logger.socket(`Setting allowed origins for sockets: ${origins.join(', ')}`);
        this.allowedOrigins = origins;
    }
    
    // Override createIOServer to apply our CORS configuration
    createIOServer(port: number, options?: ServerOptions): Server {
        this.logger.socket(`🔧 Creating Socket.IO server with AuthenticatedSocketAdapter`);
        this.logger.socket(`🔧 Port: ${port}`);
        
        // If we already created a server instance, return it
        if (this.serverInstance) {
            this.logger.socket('🔧 Reusing existing Socket.IO server instance');
            return this.serverInstance;
        }
        
        // Ensure we have the latest allowed origins - we can't await here
        if (this.allowedOrigins.length === 0) {
            this.logger.socket(`⚠️ No allowed origins set yet. Using '*' temporarily until origins are loaded.`);
            // The onModuleInit will populate this soon after
        }
        
        this.logger.socket(`🔧 Allowed origins: ${this.allowedOrigins.join(', ') || '*'}`);
        
        const serverOptions: ServerOptions = {
            ...options,
            cors: {
                origin: this.allowedOrigins.length ? this.allowedOrigins : '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            connectTimeout: 45000,
            pingTimeout: 30000,
            pingInterval: 25000
        };
        
        this.logger.socket(`🔧 Server options: ${JSON.stringify({ 
            ...serverOptions, 
            cors: { ...serverOptions.cors },
        }, null, 2)}`);
        
        // Create server using the parent class method
        // This will attach the Socket.IO server to the HTTP server
        this.serverInstance = super.createIOServer(port, serverOptions);
        
        this.logger.socket(`✅ Socket.IO server created and attached to HTTP server`);
        
        return this.serverInstance;
    }
}