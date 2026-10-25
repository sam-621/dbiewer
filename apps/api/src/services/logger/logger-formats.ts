import winston from 'winston';

export const inlineLoggerFormat = [
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    if (rest.error instanceof Error) {
      return `${timestamp} ${level}: ${rest.error.stack}`;
    }
    return `${timestamp} ${level}: ${message}`;
  })
];

export const structuredLoggerFormat = [winston.format.timestamp(), winston.format.json()];
