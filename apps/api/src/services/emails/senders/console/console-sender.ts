import type { Logger } from '@/services/logger';

import type { EmailData, EmailSender } from '../email-sender';

export class ConsoleSender implements EmailSender {
  constructor(private readonly logger: Logger) {}

  async send(email: EmailData) {
    this.logger.info(`Email "${email.subject}" sent to ${email.to}\n\n${email.text}`);
  }
}
