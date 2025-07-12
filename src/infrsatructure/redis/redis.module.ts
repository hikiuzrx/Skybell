import { Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import Redis from "ioredis";

@Module({
    exports: [RedisService],
    providers: [RedisService],
})
export default class RedisModule {}