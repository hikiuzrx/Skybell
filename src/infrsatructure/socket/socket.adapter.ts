import { Injectable, UnauthorizedException } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ClientService } from "../../modules/client/client.service";
import type { Server,ServerOptions,Socket } from "socket.io";
import  { LoggerService } from "../logger/logger.service";
import * as cookie from "cookie";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class AuthenticatedSocketAdapter extends IoAdapter {
    private allowedOrigins:string[] = [];
    constructor(
        private readonly redisService:RedisService,
        private readonly logger:LoggerService,
        private readonly clientService:ClientService,
      
    ){
        super();
    }
    setAllowedOrigins(origins: string[]) {
        this.logger.socket(`Setting allowed origins for sockets: ${origins.join(', ')}`);
        this.allowedOrigins = origins;
    }
    create(port:number,options:ServerOptions):Server{
        options.cors ={
            credentials:true,
        }
        options.transports = ['websocket', 'polling'];
         const namespaceRegex = /^\/client-[a-f0-9]{24}$/;

        const server =super.create(port,options);
         server.of(namespaceRegex)
         .use(async(socket:Socket,next)=>{
          try{
             const {clientId,token} = socket.handshake.auth;
            if (!token) {
                const cookieHeader = socket.handshake.headers.cookie;
                if (!cookieHeader) {
                    this.logger.auth("No auth proof provided");
                    return next(new Error('Unauthorized: No authentication proof provided.'));
                }
                const cookies = cookie.parse(cookieHeader);
                await this.clientService.validateToken(cookies, clientId);
            }
            const user = await this.clientService.validateToken(clientId,token);
            this.logger.auth(`Authenticated handshake from user ${clientId} with socket ID ${socket.id}`);
            socket.data.user =user ;
            socket.data.clientId = clientId; 
            next(); 
          }catch(e:any){
            this.logger.error(`Authentication error: ${e.message}`, e.stack, 'Socket');
            next(new UnauthorizedException(`Authentication error: ${e.message}`));
          }
        }).on('connection', async (socket: Socket) => {
        const clientId = socket.data.clientId;
        const socketId = socket.id;

        await this.redisService.registerConnectedClient(clientId, socketId);
        this.logger.socket(`Client ${clientId} connected to namespace ${socket.nsp.name} with socket ID ${socketId}`);

        socket.on('disconnect', async () => {
          await this.redisService.DisconnectClient(clientId, socketId);
          this.logger.socket(`Client ${clientId} disconnected`);
        });

        // handle custom events
        socket.on('message', (payload) => {
          this.logger.socket(`Message from ${clientId}: ${payload}`);
          socket.emit('response', { ack: true });
        });
      });
        return server;
    }
}