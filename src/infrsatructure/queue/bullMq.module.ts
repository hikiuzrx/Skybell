// src/infrastructure/queue/bullmq.module.ts
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { bullQueueOptions } from '../../config/bullMq.config';

export const notificationQueueProvider = {
  provide: 'NOTIFICATION_QUEUE',
  useFactory: () => {
    return new Queue('notification_queue', bullQueueOptions);
  },
};

@Module({
  providers: [notificationQueueProvider],
  exports: ['NOTIFICATION_QUEUE'],
})
export class BullMQModule {}
