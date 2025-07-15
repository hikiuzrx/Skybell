import { Module } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Module({
    exports: [RedisService],
    providers: [RedisService],
})
export default class RedisModule {}