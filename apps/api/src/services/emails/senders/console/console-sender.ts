import type { EmailData, EmailSender } from '@/services/emails/senders/email-sender';
import type { Logger } from '@/services/logger';

export class ConsoleSender implements EmailSender {
  constructor(private readonly logger: Logger) {}

  async send(email: EmailData) {
    this.logger.info(`Email "${email.subject}" sent to ${email.to}\n\n${email.text}`);
  }
}
