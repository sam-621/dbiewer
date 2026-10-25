import type { EmailData, EmailSender } from '@/services/emails/senders/email-sender';

export class DummySender implements EmailSender {
  async send(_email: EmailData) {}
}
