import type { QueueOptions, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisUsername = process.env.REDIS_USERNAME || undefined;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redisConnection = new IORedis({
  host: redisHost,
  port: redisPort,
  username: redisUsername,
  password: redisPassword,
  maxRetriesPerRequest: null,  // recommended by BullMQ
  enableReadyCheck: false,
});

export const bullQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: {
      count: 10, // keep last 10 failed jobs
    },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000, // 3s backoff
    },
  },
};

export const workerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  autorun: true,
  lockDuration: 60000, // ms
};
