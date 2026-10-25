import type { EmailSenderConfig } from '@/config';
import { createLogger } from '@/services/logger';

import { ConsoleSender } from './console';
import { DummySender } from './dummy';
import { ResendSender } from './resend';

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
  if (config.adapter === 'dummy') return new DummySender();
  if (config.adapter === 'console') return new ConsoleSender(createLogger('email'));

  if (!config.resend.apiKey) {
    throw new Error('RESEND_API_KEY is required when EMAIL_SENDER is resend');
  }

  return new ResendSender(config.resend.apiKey);
};
