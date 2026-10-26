import winston from 'winston';

import { config } from '@/config';

import { inlineLoggerFormat, structuredLoggerFormat } from './logger-formats';

const getFormat = () => (config.env === 'production' ? structuredLoggerFormat : inlineLoggerFormat);

export class Logger {
  constructor(private readonly winstonLogger: winston.Logger) {}

  info(message: string, metadata?: Record<string, unknown>): void {
    this.winstonLogger.info(message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.winstonLogger.warn(message, metadata);
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    this.winstonLogger.error(message, { ...meta, error: this.formatError(error) });
  }

  private formatError(error: unknown) {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        cause: error.cause,
        stack: error.stack
      };
    }

    return undefined;
  }
}

export const createLogger = (context: string): Logger =>
  new Logger(
    winston.createLogger({
      level: 'info',
      format: winston.format.combine(...getFormat()),
      defaultMeta: { context },
      transports: [new winston.transports.Console()]
    })
  );
