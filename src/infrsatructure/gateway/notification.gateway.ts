import { Socket } from "socket.io";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type {  OnGatewayConnection,
  OnGatewayDisconnect} from '@nestjs/websockets'
import { socketConfig } from "../../config/socket.config";