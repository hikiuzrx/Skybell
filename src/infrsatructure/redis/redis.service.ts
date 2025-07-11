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

  async pushToList(key: string, value: string) {
    return this.redisClient.rpush(key, value); // Push to right (tail)
  }

  async popFromList(key: string): Promise<string | null> {
    return this.redisClient.lpop(key); // Pop from left (head)
  }

  async getList(key: string): Promise<string[]> {
    return this.redisClient.lrange(key, 0, -1); // Get all elements
  }

  async getListLength(key: string): Promise<number> {
    return this.redisClient.llen(key);
  }

  async clearList(key: string) {
    return this.redisClient.del(key);
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }
  async registerConnectedClient(clientId: string, socketId:string) {
    return this.redisClient.hset(clientId,socketId,new Date().toISOString())
  }
  async getConnectedClients(clientId: string): Promise<string[]> {
    return this.redisClient.hkeys(clientId);
  }
  async DisconnectClient(clientId: string, socketId:string) {
    return this.redisClient.hdel(clientId,socketId);
  }
}