import type { Config } from '@/config';
import { createLogger } from '@/services/logger';

import { ConsoleSender } from './console';
import { DummySender } from './dummy';
import { ResendSender } from './resend';

export type EmailSenderConfig = Pick<Config, 'EMAIL_SENDER' | 'RESEND_API_KEY'>;

export interface EmailSender {
  send(email: EmailData): Promise<void>;
}

export type EmailAddress = {
  email: string;
  name: string;
};

export type EmailData = {
  from: EmailAddress;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export const getEmailSender = (config: EmailSenderConfig): EmailSender => {
  if (config.EMAIL_SENDER === 'dummy') return new DummySender();
  if (config.EMAIL_SENDER === 'console') return new ConsoleSender(createLogger('email'));

  if (!config.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_SENDER is resend');
  }

  return new ResendSender(config.RESEND_API_KEY);
};
