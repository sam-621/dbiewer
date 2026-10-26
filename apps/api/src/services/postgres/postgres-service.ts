import type { ClientConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Client, Pool } from 'pg';

import type { Logger } from '@/services/logger';
import { createLogger } from '@/services/logger';

import { PostgresConnectionFailedError, PostgresQueryFailedError } from './postgres-errors';

type PostgresSslMode = 'disable' | 'require' | 'verify-full';

export type PostgresCredentials = {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | null;
  sslMode: PostgresSslMode;
};

type PostgresConnection = PostgresCredentials & { id: string };

type PostgresColumn = {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

type PostgresFunctionKind = 'function' | 'procedure';

export type PostgresSchema = {
  name: string;
  tables: Array<{ name: string; estimatedRows: number | null; columns: PostgresColumn[] }>;
  views: Array<{ name: string; columns: PostgresColumn[] }>;
  functions: Array<{ name: string; arguments: string; kind: PostgresFunctionKind }>;
};

export class PostgresService {
  private static readonly CONNECTION_TIMEOUT_MS = 10_000;
  private static readonly STATEMENT_TIMEOUT_MS = 30_000;
  private static readonly POOL_MAX_CLIENTS = 3;
  private static readonly POOL_IDLE_TIMEOUT_MS = 5 * 60_000;
  private static readonly SCHEMAS_SQL = `
    with namespaces as (
      select n.oid, n.nspname
      from pg_catalog.pg_namespace n
      where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
        and n.nspname not like 'pg\\_temp\\_%'
        and n.nspname not like 'pg\\_toast\\_temp\\_%'
    ),
    relations as (
      select c.oid, c.relnamespace, c.relname, c.relkind, c.reltuples
      from pg_catalog.pg_class c
      join namespaces n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p', 'v', 'm')
    ),
    relation_columns as (
      select
        a.attrelid,
        json_agg(
          json_build_object(
            'name', a.attname,
            'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
            'isPrimaryKey', exists (
              select 1 from pg_catalog.pg_constraint k
              where k.conrelid = a.attrelid and k.contype = 'p' and a.attnum = any (k.conkey)
            ),
            'isForeignKey', exists (
              select 1 from pg_catalog.pg_constraint k
              where k.conrelid = a.attrelid and k.contype = 'f' and a.attnum = any (k.conkey)
            )
          )
          order by a.attnum
        ) as columns
      from pg_catalog.pg_attribute a
      join relations r on r.oid = a.attrelid
      where a.attnum > 0 and not a.attisdropped
      group by a.attrelid
    ),
    schema_relations as (
      select
        r.relnamespace,
        json_agg(
          json_build_object(
            'name', r.relname,
            'estimatedRows', case when r.reltuples < 0 then null else r.reltuples::bigint end,
            'columns', coalesce(rc.columns, '[]'::json)
          )
          order by r.relname
        ) filter (where r.relkind in ('r', 'p')) as tables,
        json_agg(
          json_build_object('name', r.relname, 'columns', coalesce(rc.columns, '[]'::json))
          order by r.relname
        ) filter (where r.relkind in ('v', 'm')) as views
      from relations r
      left join relation_columns rc on rc.attrelid = r.oid
      group by r.relnamespace
    ),
    schema_functions as (
      select
        p.pronamespace,
        json_agg(
          json_build_object(
            'name', p.proname,
            'arguments', pg_catalog.pg_get_function_identity_arguments(p.oid),
            'kind', case p.prokind when 'p' then 'procedure' else 'function' end
          )
          order by p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid)
        ) as functions
      from pg_catalog.pg_proc p
      join namespaces n on n.oid = p.pronamespace
      where p.prokind in ('f', 'p')
      group by p.pronamespace
    )
    select
      n.nspname as name,
      coalesce(sr.tables, '[]'::json) as tables,
      coalesce(sr.views, '[]'::json) as views,
      coalesce(sf.functions, '[]'::json) as functions
    from namespaces n
    left join schema_relations sr on sr.relnamespace = n.oid
    left join schema_functions sf on sf.pronamespace = n.oid
    where sr.relnamespace is not null or sf.pronamespace is not null
    order by n.nspname
  `;

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
      throw new PostgresConnectionFailedError(credentials, this.toReason(error));
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
      throw new PostgresConnectionFailedError(connection, this.toReason(error));
    }

    try {
      return await client.query<T>(sql, values);
    } catch (error) {
      throw new PostgresQueryFailedError(this.toReason(error));
    } finally {
      client.release();
    }
  }

  async readSchemas(connection: PostgresConnection) {
    const result = await this.query<PostgresSchema>(connection, PostgresService.SCHEMAS_SQL);

    return result.rows;
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
      options: `-c statement_timeout=${PostgresService.STATEMENT_TIMEOUT_MS}`,
      max: PostgresService.POOL_MAX_CLIENTS,
      idleTimeoutMillis: PostgresService.POOL_IDLE_TIMEOUT_MS,
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
      connectionTimeoutMillis: PostgresService.CONNECTION_TIMEOUT_MS
    };
  }

  private toReason(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
