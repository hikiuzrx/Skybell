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
    this.logger.queue('Initializing notification worker...');
    
    const worker = new Worker(
      'notification_queue',
      async (job: Job) => {
        this.logger.queue('Processing job: ' + JSON.stringify(job.data));
      },
      workerOptions,
    );

    // Add event listeners before any potential async operations
    worker.on('ready', () => {
        this.logger.success('Notification worker is ready and listening for jobs', 'Queue');
    });

    worker.on('completed', (job) => {
        this.logger.success(`Job ${job.id} completed successfully`, 'Queue');
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`, err.stack, 'Queue');
    });

    worker.on('active', (job) => {
          this.logger.queue(`Job ${job.id} is now active`);
    });

    worker.on('drained', () => {
        this.logger.success('All waiting jobs have been processed (drained)', 'Queue');
    });

    worker.on('error', (err) => {
      this.logger.error('Worker error', err.stack, 'Queue');
    });

    worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled`, 'Queue');
    });

    worker.on('progress', (job, progress) => {
      this.logger.queue(`Job ${job.id} progress: ${progress}%`);
    });

    // Log initial worker state
    this.logger.queue(`Worker created for queue: notification_queue`);
    this.logger.queue(`Worker concurrency: ${workerOptions.concurrency}`);

    // Check worker state after a short delay as fallback
    setTimeout(() => {
      if (worker.isRunning()) {
        this.logger.success('Worker is running and ready (state check)', 'Queue');
      } else {
        this.logger.warn('Worker is not running - check Redis connection', 'Queue');
      }
    }, 1000);
  }
}
