import { Module } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { AuthenticatedSocketAdapter } from './socket.adapter';
import { ClientService } from '../../modules/client/client.service';
import { LoggerService } from '../logger/logger.service';

@Module({
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
    this.logger.log(`Loaded ${origins.length} CORS origins for sockets`);
  }
}
