import * as mongoose from 'mongoose';
import { constants } from '../../shared/constants';
import { LoggerService } from '../logger/logger.service';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> => {
        const logger = new LoggerService();
        logger.database('Connecting to MongoDB...');
        logger.database(`Connection String: ${constants.DB_CONNECTION.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
        return mongoose.connect(constants.DB_CONNECTION);
    }
  },
];