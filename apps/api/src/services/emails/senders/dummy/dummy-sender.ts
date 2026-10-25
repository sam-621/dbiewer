import type { EmailData, EmailSender } from '../email-sender';

export class DummySender implements EmailSender {
  async send(_email: EmailData) {}
}
