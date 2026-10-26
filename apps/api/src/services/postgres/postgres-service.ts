import type { ClientConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Client, Pool } from 'pg';

import type { Logger } from '@/services/logger';
import { createLogger } from '@/services/logger';

import { PostgresConnectionFailedError, PostgresQueryFailedError } from './postgres-errors';

const CONNECTION_TIMEOUT_MS = 10_000;
const STATEMENT_TIMEOUT_MS = 30_000;
const POOL_MAX_CLIENTS = 3;
const POOL_IDLE_TIMEOUT_MS = 5 * 60_000;

type PostgresSslMode = 'disable' | 'require' | 'verify-full';

type PostgresCredentials = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | null;
  sslMode: PostgresSslMode;
};

type PostgresConnection = PostgresCredentials & { id: string };

export class PostgresService {
  private readonly pools = new Map<string, Pool>();
  private readonly sslByMode: Record<PostgresSslMode, ClientConfig['ssl']>;
  private readonly logger: Logger;

  constructor() {
    this.sslByMode = {
      disable: false,
      require: { rejectUnauthorized: false },
      'verify-full': { rejectUnauthorized: true }
    };
    this.logger = createLogger('postgres');
  }

  async testConnection(credentials: PostgresCredentials) {
    const client = new Client(this.toClientConfig(credentials));

    try {
      await client.connect();
      await client.query('select 1');
    } catch (error) {
      throw this.toConnectionFailedError(credentials, error);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async query<T extends QueryResultRow>(
    connection: PostgresConnection,
    sql: string,
    values?: unknown[]
  ): Promise<QueryResult<T>> {
    let client: PoolClient;

    try {
      client = await this.getPool(connection).connect();
    } catch (error) {
      throw this.toConnectionFailedError(connection, error);
    }

    try {
      return await client.query<T>(sql, values);
    } catch (error) {
      throw new PostgresQueryFailedError(this.toReason(error));
    } finally {
      client.release();
    }
  }

  async discardPool(connectionId: string) {
    const pool = this.pools.get(connectionId);

    if (!pool) return;

    this.pools.delete(connectionId);
    await pool.end();
  }

  async closePools() {
    const pools = [...this.pools.values()];

    this.pools.clear();
    await Promise.all(pools.map(pool => pool.end()));
  }

  private getPool(connection: PostgresConnection) {
    const existing = this.pools.get(connection.id);

    if (existing) return existing;

    const pool = new Pool({
      ...this.toClientConfig(connection),
      options: `-c statement_timeout=${STATEMENT_TIMEOUT_MS}`,
      max: POOL_MAX_CLIENTS,
      idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
      allowExitOnIdle: true
    });

    pool.on('error', error =>
      this.logger.warn('Idle client of a connection pool failed', {
        connectionId: connection.id,
        reason: error.message
      })
    );
    this.pools.set(connection.id, pool);

    return pool;
  }

  private toClientConfig(credentials: PostgresCredentials): ClientConfig {
    return {
      host: credentials.host,
      port: credentials.port,
      database: credentials.database,
      user: credentials.username,
      password: credentials.password ?? undefined,
      ssl: this.sslByMode[credentials.sslMode],
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS
    };
  }

  private toConnectionFailedError(credentials: PostgresCredentials, error: unknown) {
    return new PostgresConnectionFailedError(
      credentials.host,
      credentials.port,
      credentials.database,
      this.toReason(error)
    );
  }

  private toReason(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
