import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './infrsatructure/logger/logger.module';
import { BullMQModule } from './infrsatructure/queue/bullMq.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    BullMQModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
