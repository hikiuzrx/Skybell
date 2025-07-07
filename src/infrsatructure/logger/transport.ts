import winston from 'winston';

export const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
  ),
});

export const fileTransport = new winston.transports.File({
  filename: 'logs/app.log',
  format: winston.format.json(),
});
