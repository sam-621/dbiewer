import type { ShellErrorCode } from '@/api/codegen';
import { BusinessError } from '@/shared/errors/business-error';

export class ConnectionFailedError extends BusinessError<ShellErrorCode> {
  constructor(reason: string) {
    super('CONNECTION_FAILED', reason);
  }
}

export class DbObjectNotFoundError extends BusinessError<ShellErrorCode> {
  constructor(schema: string, name: string) {
    super('OBJECT_NOT_FOUND', `Table or view not found with name ${schema}.${name}`);
  }
}

export class DbFunctionNotFoundError extends BusinessError<ShellErrorCode> {
  constructor(schema: string, name: string, functionArguments: string) {
    super(
      'OBJECT_NOT_FOUND',
      `Function not found with name ${schema}.${name}(${functionArguments})`
    );
  }
}

export class QueryFailedError extends BusinessError<ShellErrorCode> {
  constructor(reason: string) {
    super('QUERY_FAILED', reason);
  }
}

export class DbTableNotFoundError extends BusinessError<ShellErrorCode> {
  constructor(schema: string, name: string) {
    super('OBJECT_NOT_FOUND', `Table not found with name ${schema}.${name}`);
  }
}

export class PrimaryKeyRequiredError extends BusinessError<ShellErrorCode> {
  constructor(schema: string, name: string, primaryKeyColumns: string[]) {
    super(
      'PRIMARY_KEY_REQUIRED',
      primaryKeyColumns.length
        ? `Row key must have exactly the primary key columns of ${schema}.${name}: ${primaryKeyColumns.join(', ')}`
        : `Table ${schema}.${name} has no primary key`
    );
  }
}
