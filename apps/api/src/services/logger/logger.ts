import winston from 'winston';

import { config } from '@/config';

import { inlineLoggerFormat, structuredLoggerFormat } from './logger-formats';

export type Logger = winston.Logger;

const getFormat = () => (config.env === 'production' ? structuredLoggerFormat : inlineLoggerFormat);

export const createLogger = (context: string): Logger =>
  winston.createLogger({
    level: 'info',
    format: winston.format.combine(...getFormat()),
    defaultMeta: { context },
    transports: [new winston.transports.Console()]
  });
