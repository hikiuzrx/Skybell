import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { AuthenticatedSocketAdapter } from './infrsatructure/socket/socket.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for development
  app.enableCors();
  const socketAdapter = app.get(AuthenticatedSocketAdapter);
  app.useWebSocketAdapter(socketAdapter);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  const logger = app.get('LoggerService');
  logger.log(`🚀 Notification service is running on http://localhost:${port}`);
}

bootstrap();
