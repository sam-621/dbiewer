import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class EmailSendFailedError extends DbiewerError {
  constructor(to: string, reason: string) {
    super(`Failed to send email to ${to}: ${reason}`);
  }
}
