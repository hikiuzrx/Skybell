// src/infrastructure/queue/bullmq.module.ts
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { bullQueueOptions } from '../../config/bullMq.config';
import { NotificationProcessor } from './notification.processor';

export const notificationQueueProvider = {
  provide: 'NOTIFICATION_QUEUE',
  useFactory: () => {
    return new Queue('notification_queue', bullQueueOptions);
  },
};

@Module({
  providers: [notificationQueueProvider, NotificationProcessor],
  exports: ['NOTIFICATION_QUEUE', NotificationProcessor],
})
export class BullMQModule {}
