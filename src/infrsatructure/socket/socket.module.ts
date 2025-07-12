import { Module,Global } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { AuthenticatedSocketAdapter } from './socket.adapter';
import { ClientService } from '../../modules/client/client.service';
import { LoggerService } from '../logger/logger.service';
import RedisModule from '../redis/redis.module';
import {ClientModule }from '../../modules/client/client.module';
import { LoggerModule } from '../logger/logger.module';
@Global() // Make this module available globally
@Module({
    imports: [RedisModule, ClientModule,LoggerModule],
  providers: [AuthenticatedSocketAdapter],
  exports: [AuthenticatedSocketAdapter],
})
export class SocketModule implements OnModuleInit {
  constructor(
    private readonly adapter: AuthenticatedSocketAdapter,
    private readonly clientService: ClientService,
    private readonly logger: LoggerService
  ) {}

  async onModuleInit() {
    const clients = await this.clientService.getActiveClients();
    const origins = clients.map(c => c.clientUrl);
    this.adapter.setAllowedOrigins(origins);
    this.logger.socket(`Loaded ${origins.length} CORS origins for sockets`);
  }
}
