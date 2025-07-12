import { Injectable} from '@nestjs/common';
import type {  LoggerService as NestLoggerService  } from '@nestjs/common';
import winston from 'winston';
import { consoleTransport, fileTransport, errorFileTransport } from './transport';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      consoleTransport, 
      fileTransport, 
      errorFileTransport
    ],
  });

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || 'App' });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { 
      context: context || 'App',
      trace 
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || 'App' });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || 'App' });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || 'App' });
  }

  // Enhanced methods with emojis and context
  success(message: string, context?: string) {
    this.logger.info(`✅ ${message}`, { context: context || 'App' });
  }

  startup(message: string) {
    this.logger.info(`🚀 ${message}`, { context: 'Startup' });
  }

  database(message: string) {
    this.logger.info(`💾 ${message}`, { context: 'Database' });
  }

  socket(message: string) {
    this.logger.info(`🔌 ${message}`, { context: 'Socket' });
  }

  queue(message: string) {
    this.logger.info(`📋 ${message}`, { context: 'Queue' });
  }

  redis(message: string) {
    this.logger.info(`🔴 ${message}`, { context: 'Redis' });
  }

  auth(message: string) {
    this.logger.info(`🔐 ${message}`, { context: 'Auth' });
  }

  api(message: string, method?: string, endpoint?: string) {
    const details = method && endpoint ? `${method} ${endpoint}` : '';
    this.logger.info(`🌐 ${message} ${details}`, { context: 'API' });
  }
}
