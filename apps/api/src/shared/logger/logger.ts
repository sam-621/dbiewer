import winston from 'winston';

import { config } from '@/shared/config';

import { inlineLoggerFormat, structuredLoggerFormat } from './logger.formats';

export type Logger = winston.Logger;

const getFormat = () =>
  config.NODE_ENV === 'production' ? structuredLoggerFormat : inlineLoggerFormat;

export const createLogger = (context: string): Logger =>
  winston.createLogger({
    level: 'info',
    format: winston.format.combine(...getFormat()),
    defaultMeta: { context },
    transports: [new winston.transports.Console()]
  });
