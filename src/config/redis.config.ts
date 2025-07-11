// src/config/redis.config.ts

const redisConfig ={

 redisHost :process.env.REDIS_HOST || 'localhost',
 redisPort : parseInt(process.env.REDIS_PORT || '6379', 10),
 redisUsername : process.env.REDIS_USERNAME || undefined,
 redisPassword : process.env.REDIS_PASSWORD || undefined,
}
export default redisConfig;
/* export const redisClient = new IORedis({
  host: redisHost,
  port: redisPort,
  username: redisUsername,
  password: redisPassword,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}); */
