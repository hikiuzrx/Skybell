// src/config/socket.config.ts
import type { GatewayMetadata } from '@nestjs/websockets';

export const socketConfig: GatewayMetadata = {
  cors: {
    origin: process.env.SOCKET_ORIGIN || '*',
    credentials: true,
  },
  transports: ['websocket'], // or ['websocket', 'polling'] if fallback needed
};
