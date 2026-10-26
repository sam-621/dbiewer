import type { ClientConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Client, escapeIdentifier, Pool } from 'pg';

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

type PostgresObject = { schema: string; name: string };

type PostgresColumnDetail = {
  name: string;
  type: string;
  isNullable: boolean;
  default: string | null;
  isPrimaryKey: boolean;
};

type PostgresIndex = { name: string; definition: string; isUnique: boolean };

type PostgresForeignKey = {
  columns: string[];
  referencedSchema: string;
  referencedTable: string;
  referencedColumns: string[];
  onDelete: string;
};

export type PostgresTableStructure = {
  columns: PostgresColumnDetail[];
  indexes: PostgresIndex[];
  foreignKeys: PostgresForeignKey[];
  definition: string;
};

type PostgresRelationRow = {
  kind: string;
  columns: PostgresColumnDetail[];
  indexes: PostgresIndex[];
  foreignKeys: PostgresForeignKey[];
  constraints: Array<{ name: string; definition: string }>;
  viewDefinition: string | null;
};

type PostgresFilterOperator =
  'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'IS_NULL' | 'IS_NOT_NULL';

type PostgresFilter = { column: string; operator: PostgresFilterOperator; value?: string | null };

type PostgresSortDirection = 'ASC' | 'DESC';

type PostgresOrder = { column: string; direction: PostgresSortDirection };

type PostgresRowsQuery = PostgresObject & {
  filters: PostgresFilter[];
  orderBy: PostgresOrder | null;
  primaryKeyColumns: string[];
  page: number;
};

export type PostgresTableRows = { rows: Array<Array<string | null>>; totalRows: number };

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
  private static readonly RELATION_SQL = `
    with relation as (
      select c.oid, c.relkind
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where n.nspname = $1 and c.relname = $2 and c.relkind in ('r', 'p', 'v', 'm')
    )
    select
      r.relkind as kind,
      (
        select coalesce(
          json_agg(
            json_build_object(
              'name', a.attname,
              'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
              'isNullable', not a.attnotnull,
              'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
              'isPrimaryKey', exists (
                select 1 from pg_catalog.pg_constraint k
                where k.conrelid = a.attrelid and k.contype = 'p' and a.attnum = any (k.conkey)
              )
            )
            order by a.attnum
          ),
          '[]'::json
        )
        from pg_catalog.pg_attribute a
        left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
        where a.attrelid = r.oid and a.attnum > 0 and not a.attisdropped
      ) as columns,
      (
        select coalesce(
          json_agg(
            json_build_object(
              'name', i.relname,
              'definition', pg_catalog.pg_get_indexdef(x.indexrelid),
              'isUnique', x.indisunique
            )
            order by i.relname
          ),
          '[]'::json
        )
        from pg_catalog.pg_index x
        join pg_catalog.pg_class i on i.oid = x.indexrelid
        where x.indrelid = r.oid
      ) as indexes,
      (
        select coalesce(
          json_agg(
            json_build_object(
              'columns', (
                select json_agg(a.attname order by k.position)
                from unnest(c.conkey) with ordinality k (attnum, position)
                join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
              ),
              'referencedSchema', rn.nspname,
              'referencedTable', rc.relname,
              'referencedColumns', (
                select json_agg(a.attname order by k.position)
                from unnest(c.confkey) with ordinality k (attnum, position)
                join pg_catalog.pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum
              ),
              'onDelete', case c.confdeltype
                when 'r' then 'RESTRICT'
                when 'c' then 'CASCADE'
                when 'n' then 'SET NULL'
                when 'd' then 'SET DEFAULT'
                else 'NO ACTION'
              end
            )
            order by c.conname
          ),
          '[]'::json
        )
        from pg_catalog.pg_constraint c
        join pg_catalog.pg_class rc on rc.oid = c.confrelid
        join pg_catalog.pg_namespace rn on rn.oid = rc.relnamespace
        where c.conrelid = r.oid and c.contype = 'f'
      ) as "foreignKeys",
      (
        select coalesce(
          json_agg(
            json_build_object('name', c.conname, 'definition', pg_catalog.pg_get_constraintdef(c.oid))
            order by case c.contype when 'p' then 0 when 'u' then 1 when 'f' then 2 else 3 end, c.conname
          ),
          '[]'::json
        )
        from pg_catalog.pg_constraint c
        where c.conrelid = r.oid and c.contype in ('p', 'u', 'f', 'c', 'x')
      ) as constraints,
      case when r.relkind in ('v', 'm') then pg_catalog.pg_get_viewdef(r.oid, true) end
        as "viewDefinition"
    from relation r
  `;
  private static readonly VIEW_KINDS = ['v', 'm'];
  private static readonly PAGE_SIZE = 50;
  private static readonly COMPARISON_OPERATORS: Record<
    Exclude<PostgresFilterOperator, 'CONTAINS' | 'IS_NULL' | 'IS_NOT_NULL'>,
    string
  > = { EQ: '=', NEQ: '<>', GT: '>', GTE: '>=', LT: '<', LTE: '<=' };

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
    return this.withClient(connection, client => client.query<T>(sql, values));
  }

  async readSchemas(connection: PostgresConnection) {
    const result = await this.query<PostgresSchema>(connection, PostgresService.SCHEMAS_SQL);

    return result.rows;
  }

  async readTableStructure(
    connection: PostgresConnection,
    object: PostgresObject
  ): Promise<PostgresTableStructure | null> {
    const result = await this.query<PostgresRelationRow>(connection, PostgresService.RELATION_SQL, [
      object.schema,
      object.name
    ]);
    const [relation] = result.rows;

    if (!relation) return null;

    if (PostgresService.VIEW_KINDS.includes(relation.kind)) {
      return {
        columns: relation.columns,
        indexes: [],
        foreignKeys: [],
        definition: relation.viewDefinition ?? ''
      };
    }

    return {
      columns: relation.columns,
      indexes: relation.indexes,
      foreignKeys: relation.foreignKeys,
      definition: this.toTableDefinition(object, relation)
    };
  }

  async readTableRows(
    connection: PostgresConnection,
    rowsQuery: PostgresRowsQuery
  ): Promise<PostgresTableRows> {
    const values: unknown[] = [];
    const where = this.toWhereClause(rowsQuery.filters, values);
    const from = `from ${escapeIdentifier(rowsQuery.schema)}.${escapeIdentifier(rowsQuery.name)}${where}`;
    const orderBy = this.toOrderByClause(rowsQuery.orderBy, rowsQuery.primaryKeyColumns);
    const limit = `limit $${values.length + 1} offset $${values.length + 2}`;
    const offset = (rowsQuery.page - 1) * PostgresService.PAGE_SIZE;

    return this.withClient(connection, async client => {
      const rows = await client.query<Array<string | null>>({
        text: `select * ${from}${orderBy} ${limit}`,
        values: [...values, PostgresService.PAGE_SIZE, offset],
        rowMode: 'array',
        types: { getTypeParser: () => (value: string) => value }
      });
      const count = await client.query<{ total: string }>(
        `select count(*) as total ${from}`,
        values
      );

      return { rows: rows.rows, totalRows: Number(count.rows[0]?.total) };
    });
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

  private async withClient<T>(
    connection: PostgresConnection,
    run: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    let client: PoolClient;

    try {
      client = await this.getPool(connection).connect();
    } catch (error) {
      throw new PostgresConnectionFailedError(connection, this.toReason(error));
    }

    try {
      return await run(client);
    } catch (error) {
      throw new PostgresQueryFailedError(this.toReason(error));
    } finally {
      client.release();
    }
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

  private toTableDefinition(object: PostgresObject, relation: PostgresRelationRow) {
    const columns = relation.columns.map(column =>
      [
        escapeIdentifier(column.name),
        column.type,
        column.isNullable ? null : 'NOT NULL',
        column.default === null ? null : `DEFAULT ${column.default}`
      ]
        .filter(part => part !== null)
        .join(' ')
    );
    const constraints = relation.constraints.map(
      constraint => `CONSTRAINT ${escapeIdentifier(constraint.name)} ${constraint.definition}`
    );
    const lines = [...columns, ...constraints].map(line => `  ${line}`).join(',\n');

    return `CREATE TABLE ${escapeIdentifier(object.schema)}.${escapeIdentifier(object.name)} (\n${lines}\n);`;
  }

  private toOrderByClause(orderBy: PostgresOrder | null, primaryKeyColumns: string[]) {
    const tieBreakers = primaryKeyColumns
      .filter(column => column !== orderBy?.column)
      .map(column => ({ column, direction: 'ASC' as const }));
    const orders = [...(orderBy ? [orderBy] : []), ...tieBreakers];

    if (!orders.length) return '';

    const columns = orders.map(
      order => `${escapeIdentifier(order.column)} ${order.direction.toLowerCase()}`
    );

    return ` order by ${columns.join(', ')}`;
  }

  private toWhereClause(filters: PostgresFilter[], values: unknown[]) {
    if (!filters.length) return '';

    const conditions = filters.map(filter => {
      const column = escapeIdentifier(filter.column);

      if (filter.operator === 'IS_NULL') return `${column} is null`;
      if (filter.operator === 'IS_NOT_NULL') return `${column} is not null`;

      values.push(filter.value);

      if (filter.operator === 'CONTAINS') {
        return `${column}::text ilike '%' || $${values.length} || '%'`;
      }

      return `${column} ${PostgresService.COMPARISON_OPERATORS[filter.operator]} $${values.length}`;
    });

    return ` where ${conditions.join(' and ')}`;
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
