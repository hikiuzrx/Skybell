import { Injectable } from '@nestjs/common';
import { 
  WebSocketGateway, 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage
} from '@nestjs/websockets';
import { LoggerService } from '../logger/logger.service';
import { Server, Socket } from 'socket.io';
import { ClientService } from '../../modules/client/client.service';
import { RedisService } from '../redis/redis.service';
import { constants } from '../../shared/constants';

@Injectable()
@WebSocketGateway({
  namespace: /^\/client-[a-f0-9]{24}$/,
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling']
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  
  constructor(
    private readonly logger: LoggerService,
    private readonly clientService: ClientService,
    private readonly redisService: RedisService
  ) {}

  async afterInit(server: Server) {
    this.logger.socket('SocketGateway initialized with dynamic namespace regex: /^\/client-[a-f0-9]{24}$/');
  }

  async handleConnection(socket: Socket) {
    try {
      this.logger.auth(`🔍 AUTHENTICATION ATTEMPT DETECTED`);
      this.logger.auth(`├── Socket ID: ${socket.id}`);
      this.logger.auth(`├── Namespace: ${socket.nsp.name}`);
      
      // Get auth data from both auth and query (for compatibility)
      const authData = socket.handshake.auth;
      const queryData = socket.handshake.query;
      const { clientId, token, fcmToken } = { ...queryData, ...authData };
      
      this.logger.auth(`├── ClientId: ${clientId}`);
      this.logger.auth(`├── Has Token: ${!!token}`);
      this.logger.auth(`├── Has FCM Token: ${!!fcmToken}`);
      
      if (!clientId) {
        this.logger.auth("❌ No clientId provided");
        socket.disconnect(true);
        return;
      }
      
      // Extract client ID from namespace
      const namespaceClientId = socket.nsp.name.replace('/client-', '');
      if (clientId !== namespaceClientId) {
        this.logger.auth(`❌ ClientId mismatch: ${clientId} vs ${namespaceClientId}`);
        socket.disconnect(true);
        return;
      }

      // Try token authentication
      if (token) {
        try {
          const user = await this.clientService.validateToken({}, clientId, token);
          socket.data.user = user;
          socket.data.clientId = clientId;
          socket.data.fcmToken = fcmToken;
          this.logger.auth(`✅ Authenticated handshake from user ${clientId} with socket ID ${socket.id}`);
          
          // Register client connection
          const cid = socket.data.clientId;
          const sid = socket.id;
          const fid = socket.data.user?.sub || 'unknown';
          if (socket.data.fcmToken) await this.redisService.storeFCMToken(cid, fid, socket.data.fcmToken);
          await this.redisService.registerConnectedClient(cid, fid, sid);
          this.logger.socket(`✅ Client ${cid} connected to namespace ${socket.nsp.name} with socket ID ${sid}`);
          
          // Set up client-specific event handlers
          socket.on('ping', (data) => {
            this.logger.socket(`📤 Client ping from ${cid}: ${JSON.stringify(data)}`);
            socket.emit('pong', { message: 'Pong', timestamp: new Date().toISOString() });
          });
          
          return;
        } catch (tokenError) {
          this.logger.auth(`❌ Token validation failed: ${tokenError.message}`);
        }
      }

      // Disconnect if authentication failed
      this.logger.auth("❌ Authentication failed");
      socket.disconnect(true);
      return;
      
    } catch (e: any) {
      this.logger.error(`Authentication error: ${e.message}`, e.stack, 'Socket');
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket) {
    if (socket.data.clientId) {
      const cid = socket.data.clientId;
      const fid = socket.data.user?.sub || 'unknown';
      await this.redisService.DisconnectClient(cid, fid);
      this.logger.socket(`❌ Client ${cid} disconnected`);
    }
  }

  @SubscribeMessage('notification-job')
  async handleNotificationJob(socket: Socket, data: any) {
    const cid = socket.data.clientId;
    this.logger.socket(`📢 Message from ${cid}: ${JSON.stringify(data)}`);
    
    const { payload, sockets = [] } = data;
    
    sockets.forEach((socketId: string) => {
      const targetSocket = socket.nsp.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit('notification', payload);
        this.logger.socket(`✅ Notification sent to socket ${socketId}`);
      } else {
        this.logger.warn(`⚠️ Socket ID ${socketId} not found in namespace ${socket.nsp.name}`);
      }
    });
    
    return { success: true, message: 'Notification job processed' };
  }
}
