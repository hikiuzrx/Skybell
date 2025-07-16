import * as mongoose from 'mongoose';
import { constants } from '../../shared/constants';
import { LoggerService } from '../logger/logger.service';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> => {
        const logger = new LoggerService();
        
        if (!constants.DB_CONNECTION) {
          logger.error('DB_CONNECTION environment variable is not set', '', 'Database');
          throw new Error('Database connection string is required');
        }

        logger.database('Connecting to MongoDB Atlas...');
        logger.database(`Connection String: ${constants.DB_CONNECTION.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
        
        try {
          const connection = await mongoose.connect(constants.DB_CONNECTION, {
            // MongoDB Atlas optimized options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
            bufferCommands: false,
          });
          
          logger.success('Successfully connected to MongoDB Atlas', 'Database');
          return connection;
        } catch (error: any) {
          logger.error(`MongoDB Atlas connection failed: ${error.message}`, error.stack, 'Database');
          
          // Log specific error types for debugging
          if (error.name === 'MongooseServerSelectionError') {
            logger.error('Server selection failed - check connection string and network', '', 'Database');
          }
          if (error.message.includes('authentication')) {
            logger.error('Authentication failed - check username and password', '', 'Database');
          }
          if (error.message.includes('network')) {
            logger.error('Network error - check internet connection', '', 'Database');
          }
          
          throw error;
        }
    }
  },
];