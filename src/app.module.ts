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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    BullMQModule,
    RedisModule,
    SocketModule,
    DatabaseModule,
    ClientModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
