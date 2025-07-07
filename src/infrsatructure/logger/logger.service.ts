import { Injectable} from '@nestjs/common';
import type {  LoggerService as NestLoggerService  } from '@nestjs/common';
import winston from 'winston';
import { consoleTransport, fileTransport } from './transport';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = winston.createLogger({
    level: 'info',
    transports: [consoleTransport, fileTransport],
  });

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(`${message} ${trace || ''}`);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
