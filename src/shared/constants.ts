// Load environment variables
import { config } from 'dotenv';
import winston from 'winston';

config(); // This loads the .env file

// Basic logger for configuration loading
const configLogger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export const constants = {
    DB_CONNECTION: process.env.DB_CONNECTION || 'mongodb://localhost/nest',
    JWT_SECRET: process.env.JWT_SECRET || 'default_secret',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_USERNAME: process.env.REDIS_USERNAME || undefined,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    PORT: process.env.PORT || 3000,
    WEBSOCKET_PORT: process.env.PORT || 3000, // Use the same port as HTTP for WebSockets
    WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
    SOCKET_IO_URL: process.env.SOCKET_IO_URL || 'http://localhost:3000',
    ADMIN_ID: process.env.ADMIN_ID || 'admin',
    GRPC_PORT: parseInt(process.env.GRPC_PORT || '50051', 10),
};

// Debug: Log the DB connection (hide credentials)
configLogger.info('🔧 DB_CONNECTION loaded: ' + (constants.DB_CONNECTION?.replace(/\/\/.*@/, '//***@') || 'NOT SET'));