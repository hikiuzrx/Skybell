
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { constants } from '../../shared/constants';

@Module({
  imports: [
    MongooseModule.forRoot(constants.DB_CONNECTION, {
      // Add any additional mongoose options here if needed
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
