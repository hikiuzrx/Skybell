import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggerService } from './infrsatructure/logger/logger.service';
import { AuthenticatedSocketAdapter } from './infrsatructure/socket/socket.adapter';
import { constants } from './shared/constants';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import { HttpAdapterHost } from '@nestjs/core';
import { RedisService } from './infrsatructure/redis/redis.service';
import { ClientService } from './modules/client/client.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get services
  const logger = app.get(LoggerService);
  
  // Create socket adapter
  const httpAdapterHost = app.get(HttpAdapterHost);
  const redisService = app.get(RedisService);
  const clientService = app.get(ClientService);
  
  const socketAdapter = new AuthenticatedSocketAdapter(
    httpAdapterHost,
    redisService,
    logger,
    clientService
  );
  
  logger.log('🔌 Created socket adapter', 'Bootstrap');
  
  // Use the socket adapter
  app.useWebSocketAdapter(socketAdapter);
  logger.log('🔌 WebSocket adapter registered with NestJS app', 'Bootstrap');

  // Load the allowed origins before starting the server
  const origins = await socketAdapter.refreshAllowedOrigins();
  logger.log(`🔌 Initialized WebSocket allowed origins: [${origins.join(', ')}]`, 'Bootstrap');

  // HTTP server will start after microservices
  
  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('REST API for notification service with GRPC support')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = constants.PORT || 3000;
  const grpcPort = constants.GRPC_PORT || 50051;
  
  // Configure gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'client_registration',
      protoPath: join(__dirname, '../proto/client-registration.proto'),
      url: `localhost:${grpcPort}`,
    },
  });
  
  // Start microservices and then HTTP server
  await app.startAllMicroservices();
  await app.listen(port);
  
  // Startup logs
  logger.startup(`🚀 HTTP Server running on http://localhost:${port}`);
  logger.startup(`🔌 GRPC Server running on localhost:${grpcPort}`);
  logger.api(`API Documentation available at http://localhost:${port}/api/docs`, 'GET', '/api/docs');
  logger.api(`REST API base URL: http://localhost:${port}/api/v1`, 'INFO', '/api/v1');
  logger.success('All modules loaded successfully');
  logger.socket('WebSocket server ready for connections');
  logger.database('Database connection established');
  logger.redis('Redis connection active');
  
  logger.log('🔌 GRPC Services registered:', 'GRPC');
  logger.log('🔌 - ClientRegistrationService.RegisterClient', 'GRPC');
  logger.log('🔌 - NotificationService.RegisterFCMToken', 'GRPC');
  logger.success('🎉 Notification Service is ready!');
}

bootstrap().catch(err => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
