import IORedis from 'ioredis';
import redisConfig from '../../config/redis.config';
import { Injectable } from '@nestjs/common';
import type { OnModuleInit,OnModuleDestroy } from '@nestjs/common';
@Injectable()
export class RedisService implements OnModuleInit,OnModuleDestroy {
    private redisClient!: IORedis;
    
    onModuleInit() {
        this.redisClient = new IORedis({
        host: redisConfig.redisHost,
        port: redisConfig.redisPort,
        username: redisConfig.redisUsername,
        password: redisConfig.redisPassword,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        });
    }
    
    getClient(): IORedis {
        return this.redisClient;
    }
  onModuleDestroy() {
    this.redisClient.quit();
  }
  async registerConnectedClient(clientId: string,userId:string, socketId:string) {
    return this.redisClient.hset(`${clientId}:${userId}`,socketId,Date.now().toString());
  }
  async getConnectedClient(clientId: string, userId:string): Promise<string | null> {
    return this.redisClient.hget(clientId, userId);
  }
  async getConnectedClients(clientId: string,userId:string): Promise<string[]> {
    return this.redisClient.hkeys(`${clientId}:${userId}`);
  }
  async DisconnectClient(clientId: string, userId:string) {
    return this.redisClient.hdel(clientId, userId);
  }
  async storeFCMToken(clientId: string, userId: string, fcmToken: string) {
    return this.redisClient.hsetnx(`${clientId}:${userId}`, fcmToken, Date.now().toString());
  }
  async getFCMToken(clientId: string, userId: string): Promise<string[] | null> {
    return this.redisClient.hkeys(`${clientId}:${userId}`);
  }
}