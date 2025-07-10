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
@WebSocketGateway(socketConfig)
export class NotificationGateway implements OnGatewayConnection,OnGatewayDisconnect {
    constructor(private readonly logger:LoggerService , private readonly clientService:ClientService){}
    @WebSocketServer()
    server!: Server;
    handleDisconnect(client: any) { 

        throw new Error("Method not implemented.");
    }
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
        //store in redis the connection 
      
      }
    }

}


