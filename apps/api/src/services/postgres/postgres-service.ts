import type { ClientConfig } from 'pg';
import { Client } from 'pg';

import { PostgresConnectionFailedError } from './postgres-errors';

const CONNECTION_TIMEOUT_MS = 10_000;

type PostgresSslMode = 'disable' | 'require' | 'verify-full';

type PostgresCredentials = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | null;
  sslMode: PostgresSslMode;
};

const SSL_BY_MODE: Record<PostgresSslMode, ClientConfig['ssl']> = {
  disable: false,
  require: { rejectUnauthorized: false },
  'verify-full': { rejectUnauthorized: true }
};

export class PostgresService {
  async testConnection(credentials: PostgresCredentials) {
    const client = new Client({
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.username,
      password: credentials.password ?? undefined,
      ssl: SSL_BY_MODE[credentials.sslMode],
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS
    });

    try {
      await client.connect();
      await client.query('select 1');
    } catch (error) {
      throw new PostgresConnectionFailedError(
        credentials.host,
        credentials.port,
        credentials.database,
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
