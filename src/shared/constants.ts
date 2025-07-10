export const constants = {
    DB_CONNECTION:process.env.DB_CONNECTION || 'mongodb://localhost/nest',
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_USERNAME: process.env.REDIS_USERNAME || undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    PORT: process.env.PORT || 3000,
    WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
}