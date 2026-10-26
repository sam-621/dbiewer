import type { ShellErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class ConnectionFailedError extends BusinessError<ShellErrorCode> {
  constructor(reason: string) {
    super('CONNECTION_FAILED', reason);
  }
}
