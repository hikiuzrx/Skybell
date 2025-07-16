
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { constants } from '../../shared/constants';
import winston from 'winston';

// Basic logger for database connection events
const dbLogger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message }) => `💾 [Database] ${message}`)
      )
    })
  ]
});

@Module({
  imports: [
    MongooseModule.forRoot(constants.DB_CONNECTION, {
      retryAttempts: 3,
      retryDelay: 1000,
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          dbLogger.info('Connected to MongoDB successfully');
        });
        connection.on('error', (err) => {
          dbLogger.error('MongoDB connection error: ' + err.message);
        });
        connection.on('disconnected', () => {
          dbLogger.warn('MongoDB disconnected');
        });
        return connection;
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
