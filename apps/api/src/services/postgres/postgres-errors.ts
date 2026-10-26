import { DbiewerError } from '@/shared/errors/dbiewer-error';

export class PostgresConnectionFailedError extends DbiewerError {
  constructor(host: string, port: number, database: string, reason: string) {
    super(`Failed to connect to ${host}:${port}/${database}: ${reason}`);
  }
}
