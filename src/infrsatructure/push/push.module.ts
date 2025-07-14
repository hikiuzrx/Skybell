import { PushService } from './push.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
