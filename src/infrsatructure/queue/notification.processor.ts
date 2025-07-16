import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import type { INotificationJob } from '../../types/notification-job.type';
import { workerOptions } from '../../config/bullMq.config';
import { LoggerService } from '../logger/logger.service';
import io from 'socket.io-client';
import { socketConfig } from '../../config/socket.config';
import { RedisService } from '../redis/redis.service';
import { ClientService } from '../../modules/client/client.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly clientService: ClientService,
    private readonly logger: LoggerService,
    private readonly pushService: PushService,
  ) {}

  onModuleInit(): void {
    this.logger.queue('Initializing notification worker...');
    this.logger.queue(
      `Socket connected to ${socketConfig.url} with transports: ${socketConfig.transport.join(', ')}`
    );

    const worker = new Worker(
      'notification_queue',
      async (job: Job<INotificationJob>) => {
        await this.handleJob(job); // Fix: Actually call the handler
      },
      workerOptions,
    );

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

    this.logger.queue(`Worker created for queue: notification_queue`);
    this.logger.queue(`Worker concurrency: ${workerOptions.concurrency}`);

    setTimeout(() => {
      if (worker.isRunning()) {
        this.logger.success('Worker is running and ready (state check)', 'Queue');
      } else {
        this.logger.warn('Worker is not running - check Redis connection', 'Queue');
      }
    }, 1000);
  }

  async handleJob(job: Job<INotificationJob>) {
    this.logger.queue(`Handling job: ${job.id}`);
    const { clientId, users, payload } = job.data;
    
    try {
      if (!clientId || !users || !users.length) {
        throw new Error('Invalid job data: clientId and users array are required');
      }
      
      if (!payload) {
        this.logger.warn(`Job ${job.id} has no payload`, 'Queue');
        return;
      }

      // Get connected sockets for all users
      const connectedSockets: string[] = [];
      for (const userId of users) {
        const userSockets = await this.redisService.getConnectedClients(clientId, userId);
        connectedSockets.push(...userSockets);
      }

      // Filter users who are not connected (need push notifications)
      const offlineUsers = users.filter(async userId => {
        const userSockets = await this.redisService.getConnectedClients(clientId, userId);
        return userSockets.length === 0;
      });

      const isOnline = connectedSockets.length > 0;

      if (isOnline) {
        // Send real-time notifications via socket
        const socket = io(`${socketConfig.url}/client-${clientId}`, {
          transports: socketConfig.transport,
          auth: {
            clientId: socketConfig.auth.clientId,
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          this.logger.queue(`Connected to namespace /client-${clientId}`);
          socket.emit('notification-job', { payload, sockets: connectedSockets });
          socket.disconnect();
        });

        socket.on('connect_error', (err: any) => {
          this.logger.error(`Socket connection error: ${err.message}`, err.stack, 'Socket');
        });
      }

      // Send push notifications to offline users
      for (const userId of offlineUsers) {
        const fcmTokens = await this.redisService.getFCMToken(clientId, userId);
        if (fcmTokens && fcmTokens.length > 0) {
          if (fcmTokens.length === 1) {
            await this.pushService.sendNotification(fcmTokens[0] as unknown as string , { payload });
          } else {
            await this.pushService.sendToMultiple(fcmTokens, { payload });
          }
        } else {
          this.logger.warn(`No FCM tokens found for client ${clientId} and user ${userId}`, 'Queue');
        }
      }

    } catch (e: any) {
      this.logger.error(`Error handling job ${job.id}: ${e.message}`, e.stack, 'Queue');
      throw e;
    }
  }
}
