import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class MagicLinkLimitExceededError extends DbiewerError {
  constructor(email: string, limit: number, windowInMinutes: number) {
    super(`Magic link limit of ${limit} per ${windowInMinutes} minutes exceeded for ${email}`);
  }
}
