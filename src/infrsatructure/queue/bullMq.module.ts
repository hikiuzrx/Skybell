// src/infrastructure/queue/bullmq.module.ts
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { bullQueueOptions } from '../../config/bullMq.config';
import { NotificationProcessor } from './notification.processor';
import RedisModule from '../redis/redis.module';
import { ClientModule } from '../../modules/client/client.module';

export const notificationQueueProvider = {
  provide: 'NOTIFICATION_QUEUE',
  useFactory: () => {
    return new Queue('notification_queue', bullQueueOptions);
  },
};

@Module({
  imports: [RedisModule, ClientModule],
  providers: [notificationQueueProvider, NotificationProcessor],
  exports: ['NOTIFICATION_QUEUE', NotificationProcessor],
})
export class BullMQModule {}
