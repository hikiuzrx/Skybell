import { Module, forwardRef } from '@nestjs/common';
import { AuthenticatedSocketAdapter } from './socket.adapter';
import { SocketGateway } from './socket.gateway';
import RedisModule from '../redis/redis.module';
import { LoggerModule } from '../logger/logger.module';
import { ClientModule } from '../../modules/client/client.module';

@Module({
  imports: [RedisModule, LoggerModule, forwardRef(() => ClientModule)],
  providers: [AuthenticatedSocketAdapter, SocketGateway],
  exports: [AuthenticatedSocketAdapter, SocketGateway],
})
export class SocketModule {}
