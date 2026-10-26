import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class SecretDecryptionFailedError extends DbiewerError {
  constructor(reason: string) {
    super(`Failed to decrypt secret: ${reason}`);
  }
}
