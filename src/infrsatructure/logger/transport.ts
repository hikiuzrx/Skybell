import winston from 'winston';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    const contextStr = context ? `[${context}]`.padEnd(13) : '[App]'.padEnd(13);
    const traceStr = trace ? `\n${trace}` : '';
    
    // Add emoji based on level with consistent spacing
    const levelEmoji = {
      error: '❌',
      warn: '⚠️ ',
      info: 'ℹ️ ',
      debug: '🐛',
      verbose: '📝'
    }[level] || 'ℹ️ ';
    
    const levelStr = level.toUpperCase().padEnd(8);
    
    return `${timestamp} ${levelEmoji} ${levelStr} ${contextStr} ${message}${traceStr}`;
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
