import { Resend } from 'resend';

import { EmailSendFailedError } from '@/services/emails/email-errors';
import type { EmailData, EmailSender } from '@/services/emails/senders/email-sender';

export class ResendSender implements EmailSender {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(email: EmailData) {
    const { error } = await this.resend.emails.send({
      from: `${email.from.name} <${email.from.email}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text
    });

    if (error) throw new EmailSendFailedError(email.to, error.message);
  }
}
