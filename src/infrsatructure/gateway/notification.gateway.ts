import { Server, Socket } from "socket.io";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage, 
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import * as cookie from "cookie";
import type {  OnGatewayConnection,
  OnGatewayDisconnect} from '@nestjs/websockets'
import { socketConfig } from "../../config/socket.config";
import { LoggerService } from "../logger/logger.service";
import type { ClientService } from "../../modules/client/client.service";
import { RedisService } from "../redis/redis.service";
@WebSocketGateway(socketConfig)
export class NotificationGateway implements OnGatewayConnection,OnGatewayDisconnect {
    constructor(private readonly logger:LoggerService , 
      private readonly clientService:ClientService,
      private readonly redisService:RedisService){}
    @WebSocketServer()
    server!: Server;
    async handleConnection(socket:Socket) {
      const { clientId,token } = socket.handshake.auth
      if(!token){
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) {
          socket.emit('error', { message: 'No authentication proof provided.' });
          this.logger.log("no auth proof provided");
          socket.disconnect();
          return;
        }
        const cookies = cookie.parse(cookieHeader);
        await this.clientService.validateToken(cookies,clientId)
       }
      await this.clientService.validateToken(clientId,token) //store in redis the connection 
      await this.redisService.registerConnectedClient(clientId,socket.id);
      this.logger.log(`Client ${clientId} connected with socket ID ${socket.id}`);
      }
  async handleDisconnect(socket:Socket) {
    const { clientId } = socket.handshake.auth;
    await this.redisService.DisconnectClient(clientId,socket.id);
    this.logger.log(`Client ${clientId} disconnected from socket ID ${socket.id}`);
  }

}


