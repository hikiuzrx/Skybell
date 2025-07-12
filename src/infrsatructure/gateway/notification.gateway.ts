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
import { LoggerService } from "../logger/logger.service";
import type { ClientService } from "../../modules/client/client.service";
import { RedisService } from "../redis/redis.service";
@WebSocketGateway()
export class NotificationGateway implements OnGatewayConnection,OnGatewayDisconnect {
    constructor(private readonly logger:LoggerService , 
      private readonly clientService:ClientService,
      private readonly redisService:RedisService){}
    @WebSocketServer()
    server!: Server;
    async handleConnection(socket:Socket) {
      const { clientId} = socket.data;
      await this.redisService.registerConnectedClient(clientId,socket.id);
      this.logger.log(`Client ${clientId} connected with socket ID ${socket.id}`);
      }
  async handleDisconnect(socket:Socket) {
    const { clientId } = socket.handshake.auth;
    await this.redisService.DisconnectClient(clientId,socket.id);
    this.logger.log(`Client ${clientId} disconnected from socket ID ${socket.id}`);
  }

}


