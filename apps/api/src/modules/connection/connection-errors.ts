import type { ConnectionErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class ConnectionNameAlreadyExistsError extends BusinessError<ConnectionErrorCode> {
  constructor(name: string) {
    super('CONNECTION_NAME_ALREADY_EXISTS', `Connection name ${name} already exists`);
  }
}

export class ConnectionNotFoundError extends BusinessError<ConnectionErrorCode> {
  constructor(id: string) {
    super('CONNECTION_NOT_FOUND', `Connection not found with id ${id}`);
  }
}
