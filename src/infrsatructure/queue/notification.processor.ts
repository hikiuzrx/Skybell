// src/processor/notification.processor.ts
import { Inject, Injectable } from '@nestjs/common';
import type {OnModuleInit} from '@nestjs/common'
import { Worker, Job } from 'bullmq';
import { workerOptions } from '../../config/bullMq.config';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class NotificationProcessor implements OnModuleInit {
 constructor(private readonly logger: LoggerService) {}
  onModuleInit() :void{
    const worker = new Worker(
      'notification_queue',
      async (job: Job) => {
        this.logger.log('Processing job:'+ job.data);
      },
      workerOptions,
    );
    worker.on('completed',job=>{
        this.logger.log(`the job with the id : ${job.id} is compelted `)
    })
    worker.on('failed', (job, err) => {
      this.logger.error(`❌ Job ${job?.id} failed: ${err.message}`, err.stack);
    });
    worker.on('active',job=>{
          this.logger.log(`▶️ Job ${job.id} is now active`);
    })
    worker.on('drained',()=>{
        this.logger.log('🏁 All waiting jobs have been processed (drained)');
    })
    worker.on('ready',()=>{
        this.logger.log('🔄 Notification worker is ready and listening for jobs');
    })
    worker.on('error', err => {
      this.logger.error('⚠️ Worker error', err.stack);
    });

  }
}
