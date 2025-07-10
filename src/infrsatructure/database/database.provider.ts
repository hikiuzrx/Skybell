import * as mongoose from 'mongoose';
import { constants } from '../../shared/constants';
import { LoggerService } from '../logger/logger.service';


export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (): Promise<typeof mongoose> =>{
        const logger = new LoggerService();
        logger.log('Connecting to MongoDB...');
        logger.log(`DB Connection String: ${constants.DB_CONNECTION}`);
        return mongoose.connect(constants.DB_CONNECTION)
    }
  },
];