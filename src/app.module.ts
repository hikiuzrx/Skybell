import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './infrsatructure/logger/logger.module';
import { BullMQModule } from './infrsatructure/queue/bullMq.module';
import RedisModule from './infrsatructure/redis/redis.module';
import { SocketModule } from './infrsatructure/socket/socket.module';
import { DatabaseModule } from './infrsatructure/database/database.module';
import { ClientModule } from './modules/client/client.module';
import { PushModule } from './infrsatructure/push/push.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PushModule,
    BullMQModule,
    RedisModule,
    SocketModule,
    DatabaseModule,
    ClientModule,
    ClientsModule.register([
      {
        name: 'CLIENT_REGISTRATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'client_registration',
          protoPath: join(__dirname, '../proto/client-registration.proto'),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

