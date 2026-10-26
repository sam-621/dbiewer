import { DbiewerError } from '@/shared/errors/dbiewer-error';

import type { PostgresCredentials } from './postgres-service';

export class PostgresConnectionFailedError extends DbiewerError {
  constructor(credentials: PostgresCredentials, reason: string) {
    super(
      `Failed to connect to ${credentials.host}:${credentials.port}/${credentials.database}: ${reason}`
    );
  }
}

export class PostgresQueryFailedError extends DbiewerError {
  constructor(reason: string) {
    super(reason);
  }
}
