import { PushService } from './push.service';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';  // Add this import

@Module({
  imports: [LoggerModule],  // Add LoggerModule import
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
