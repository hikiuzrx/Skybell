import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { AuthenticatedSocketAdapter } from './infrsatructure/socket/socket.adapter';
import { LoggerService } from './infrsatructure/logger/logger.service';  // Add this import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for development
  app.enableCors();
  const socketAdapter = app.get(AuthenticatedSocketAdapter);
  app.useWebSocketAdapter(socketAdapter);
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  
  // Enhanced startup logging
  const logger = app.get(LoggerService);
  logger.startup(`Notification Service is running on http://localhost:${port}`);
  logger.success('All modules loaded successfully');
  logger.socket('WebSocket server ready for connections');
  logger.database('Database connection established');
  logger.redis('Redis connection active');
}

bootstrap();
