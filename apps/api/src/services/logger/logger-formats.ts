import winston from 'winston';

const getStack = (error: unknown) =>
  typeof error === 'object' && error !== null && 'stack' in error ? error.stack : undefined;

export const inlineLoggerFormat = [
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    if (rest.error) {
      return `${timestamp} ${level}: ${getStack(rest.error)}`;
    }
    return `${timestamp} ${level}: ${message}`;
  })
];

export const structuredLoggerFormat = [winston.format.timestamp(), winston.format.json()];
