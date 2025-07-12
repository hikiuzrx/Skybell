import winston from 'winston';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]` : '';
    const traceStr = trace ? `\n${trace}` : '';
    
    // Add emoji based on level
    const levelEmoji = {
      error: '❌',
      warn: '⚠️ ',
      info: 'ℹ️ ',
      debug: '🐛',
      verbose: '📝'
    }[level] || 'ℹ️ ';
    
    return `${timestamp} ${levelEmoji} ${level.toUpperCase().padEnd(7)} ${contextStr} ${message}${traceStr}`;
  })
);

export const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    customFormat
  ),
});

export const fileTransport = new winston.transports.File({
  filename: 'logs/app.log',
  format: winston.format.combine(
    winston.format.uncolorize(),
    winston.format.json()
  ),
});

// Add error-specific file transport
export const errorFileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: winston.format.combine(
    winston.format.uncolorize(),
    winston.format.json()
  ),
});
