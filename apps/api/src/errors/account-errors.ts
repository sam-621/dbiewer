import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class UnauthenticatedError extends DbiewerError {
  constructor() {
    super('Authentication required');
  }
}
