import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

import type { ClientConfig, FieldDef, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { Client, escapeIdentifier, Pool, Query } from 'pg';

import type { PostgresConfig } from '@/config';
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

type PostgresFunction = PostgresObject & { arguments: string };

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

type PostgresRowsQuery = PostgresObject & {
  where: string | null;
  orderBy: string | null;
  primaryKeyColumns: string[];
  page: number;
};

type PostgresDiagramProperty = {
  name: string;
  type: string;
  default: string | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

type PostgresDiagramEntity = {
  id: string;
  schema: string;
  name: string;
  properties: PostgresDiagramProperty[];
};

type PostgresDiagramRelation = {
  id: string;
  type: 'ONE_TO_ONE' | 'MANY_TO_ONE';
  fromEntityId: string;
  fromProperties: string[];
  toEntityId: string;
  toProperties: string[];
};

export type PostgresDiagram = {
  entities: PostgresDiagramEntity[];
  relations: PostgresDiagramRelation[];
};

type PostgresCellValue = { column: string; value: string | null };

type PostgresTableChanges = PostgresObject & {
  updates: Array<{ key: PostgresCellValue[]; values: PostgresCellValue[] }>;
  inserts: Array<{ values: PostgresCellValue[] }>;
};

type PostgresRowsDeletion = PostgresObject & { keys: PostgresCellValue[][] };

export type PostgresTableRows = { rows: Array<Array<string | null>>; totalRows: number };

type PostgresResultColumn = { name: string; type: string };

type PostgresRow = Array<string | null>;

type PostgresStreamedResult = { fields: FieldDef[]; command: string; rowCount: number | null };

type PostgresStreamedRows = { rows: PostgresRow[]; count: number };

export type PostgresQueryExecution = {
  columns: PostgresResultColumn[];
  rows: Array<Array<string | null>>;
  rowCount: number;
  isTruncated: boolean;
  durationMs: number;
  command: string;
};

export class PostgresService {
  private static readonly CONNECTION_TIMEOUT_MS = 10_000;
  private static readonly STATEMENT_TIMEOUT_MS = 30_000;
  private static readonly POOL_MAX_CLIENTS = 3;
  private static readonly POOL_IDLE_TIMEOUT_MS = 5 * 60_000;
  private static readonly NAMESPACES_SQL = `
    namespaces as (
      select n.oid, n.nspname
      from pg_catalog.pg_namespace n
      where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
        and n.nspname not like 'pg\\_temp\\_%'
        and n.nspname not like 'pg\\_toast\\_temp\\_%'
    )
  `;
  private static readonly SCHEMAS_SQL = `
    with ${PostgresService.NAMESPACES_SQL},
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
  private static readonly DIAGRAM_SQL = `
    with ${PostgresService.NAMESPACES_SQL},
    tables as (
      select c.oid, n.nspname, c.relname
      from pg_catalog.pg_class c
      join namespaces n on n.oid = c.relnamespace
      where c.relkind in ('r', 'p')
    )
    select
      (
        select coalesce(
          json_agg(
            json_build_object(
              'id', t.nspname || '.' || t.relname,
              'schema', t.nspname,
              'name', t.relname,
              'properties', (
                select coalesce(
                  json_agg(
                    json_build_object(
                      'name', a.attname,
                      'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
                      'default', pg_catalog.pg_get_expr(d.adbin, d.adrelid),
                      'isNullable', not a.attnotnull,
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
                  ),
                  '[]'::json
                )
                from pg_catalog.pg_attribute a
                left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                where a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
              )
            )
            order by t.nspname, t.relname
          ),
          '[]'::json
        )
        from tables t
      ) as entities,
      (
        select coalesce(
          json_agg(
            json_build_object(
              'id', source.nspname || '.' || source.relname || '.' || c.conname,
              'type', case
                when exists (
                  select 1
                  from pg_catalog.pg_index x
                  cross join lateral (
                    select array_agg(k.attnum) as attnums
                    from unnest(x.indkey::int2[]) with ordinality k (attnum, position)
                    where k.position <= x.indnkeyatts
                  ) index_key
                  where x.indrelid = c.conrelid
                    and x.indisunique
                    and x.indpred is null
                    and index_key.attnums @> c.conkey
                    and index_key.attnums <@ c.conkey
                ) then 'ONE_TO_ONE'
                else 'MANY_TO_ONE'
              end,
              'fromEntityId', source.nspname || '.' || source.relname,
              'fromProperties', (
                select json_agg(a.attname order by k.position)
                from unnest(c.conkey) with ordinality k (attnum, position)
                join pg_catalog.pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
              ),
              'toEntityId', target.nspname || '.' || target.relname,
              'toProperties', (
                select json_agg(a.attname order by k.position)
                from unnest(c.confkey) with ordinality k (attnum, position)
                join pg_catalog.pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum
              )
            )
            order by source.nspname, source.relname, c.conname
          ),
          '[]'::json
        )
        from pg_catalog.pg_constraint c
        join tables source on source.oid = c.conrelid
        join tables target on target.oid = c.confrelid
        where c.contype = 'f'
      ) as relations
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
  private static readonly FUNCTION_DEFINITION_SQL = `
    select pg_catalog.pg_get_functiondef(p.oid) as definition
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = $1
      and p.proname = $2
      and pg_catalog.pg_get_function_identity_arguments(p.oid) = $3
      and p.prokind in ('f', 'p')
  `;
  private static readonly PRIMARY_KEY_SQL = `
    select coalesce(
      (
        select json_agg(a.attname order by k.position)
        from pg_catalog.pg_constraint p
        cross join lateral unnest(p.conkey) with ordinality k (attnum, position)
        join pg_catalog.pg_attribute a on a.attrelid = p.conrelid and a.attnum = k.attnum
        where p.conrelid = c.oid and p.contype = 'p'
      ),
      '[]'::json
    ) as "primaryKeyColumns"
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = $1 and c.relname = $2 and c.relkind in ('r', 'p')
  `;
  private static readonly VIEW_KINDS = ['v', 'm'];
  private static readonly PAGE_SIZE = 50;
  private static readonly MAX_RESULT_ROWS = 1_000;
  private static readonly PRIVATE_SUBNETS: Array<[string, number, 'ipv4' | 'ipv6']> = [
    ['0.0.0.0', 8, 'ipv4'],
    ['10.0.0.0', 8, 'ipv4'],
    ['100.64.0.0', 10, 'ipv4'],
    ['127.0.0.0', 8, 'ipv4'],
    ['169.254.0.0', 16, 'ipv4'],
    ['172.16.0.0', 12, 'ipv4'],
    ['192.0.0.0', 24, 'ipv4'],
    ['192.168.0.0', 16, 'ipv4'],
    ['198.18.0.0', 15, 'ipv4'],
    ['224.0.0.0', 3, 'ipv4'],
    ['::', 128, 'ipv6'],
    ['::1', 128, 'ipv6'],
    ['fc00::', 7, 'ipv6'],
    ['fe80::', 10, 'ipv6'],
    ['ff00::', 8, 'ipv6']
  ];
  private static readonly COLUMN_TYPES_SQL = `
    select pg_catalog.format_type(t.oid, t.modifier) as type
    from unnest($1::oid[], $2::int[]) with ordinality as t (oid, modifier, position)
    order by t.position
  `;

  private readonly pools = new Map<string, Pool>();
  private readonly sslByMode: Record<PostgresSslMode, ClientConfig['ssl']>;
  private readonly logger: Logger;
  private readonly privateNetworks: BlockList;

  constructor(private readonly config: PostgresConfig) {
    this.sslByMode = {
      disable: false,
      require: { rejectUnauthorized: false },
      'verify-full': { rejectUnauthorized: true }
    };
    this.logger = createLogger('postgres');
    this.privateNetworks = new BlockList();

    for (const [address, prefix, type] of PostgresService.PRIVATE_SUBNETS) {
      this.privateNetworks.addSubnet(address, prefix, type);
    }
  }

  async testConnection(credentials: PostgresCredentials) {
    await this.assertPublicHost(credentials);

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

  async readDiagram(connection: PostgresConnection): Promise<PostgresDiagram> {
    const result = await this.query<PostgresDiagram>(connection, PostgresService.DIAGRAM_SQL);

    return result.rows[0] ?? { entities: [], relations: [] };
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

  async readFunctionDefinition(
    connection: PostgresConnection,
    dbFunction: PostgresFunction
  ): Promise<string | null> {
    const result = await this.query<{ definition: string }>(
      connection,
      PostgresService.FUNCTION_DEFINITION_SQL,
      [dbFunction.schema, dbFunction.name, dbFunction.arguments]
    );

    return result.rows[0]?.definition ?? null;
  }

  async readTableRows(
    connection: PostgresConnection,
    rowsQuery: PostgresRowsQuery
  ): Promise<PostgresTableRows> {
    const table = `${escapeIdentifier(rowsQuery.schema)}.${escapeIdentifier(rowsQuery.name)}`;
    const from = `from ${table}${this.toWhereClause(rowsQuery.where)}`;
    const orderBy = this.toOrderByClause(rowsQuery.orderBy, rowsQuery.primaryKeyColumns);
    const offset = (rowsQuery.page - 1) * PostgresService.PAGE_SIZE;

    return this.withClient(
      connection,
      async client => {
        const rows = await client.query<Array<string | null>>({
          text: `select * ${from}${orderBy}\nlimit $1 offset $2`,
          values: [PostgresService.PAGE_SIZE, offset],
          rowMode: 'array',
          types: { getTypeParser: () => (value: string) => value }
        });
        const count = await client.query<{ total: string }>(`select count(*) as total ${from}`);

        return { rows: rows.rows, totalRows: Number(count.rows[0]?.total) };
      },
      { discardClient: true }
    );
  }

  async runQuery(connection: PostgresConnection, sql: string): Promise<PostgresQueryExecution> {
    return this.withClient(
      connection,
      async client => {
        const startedAt = performance.now();
        const { results, rowsByResult } = await this.streamQuery(client, sql);
        const durationMs = Math.round(performance.now() - startedAt);
        const result = results.findLast(item => item.fields.length > 0) ?? results.at(-1);

        if (!result) {
          return {
            columns: [],
            rows: [],
            rowCount: 0,
            isTruncated: false,
            durationMs,
            command: ''
          };
        }

        const { rows, count } = rowsByResult.get(result) ?? { rows: [], count: 0 };

        return {
          columns: await this.readResultColumns(client, result.fields),
          rows,
          rowCount: count,
          isTruncated: count > PostgresService.MAX_RESULT_ROWS,
          durationMs,
          command:
            result.rowCount === null ? result.command : `${result.command} ${result.rowCount}`
        };
      },
      { discardClient: true }
    );
  }

  async readPrimaryKeyColumns(
    connection: PostgresConnection,
    object: PostgresObject
  ): Promise<string[] | null> {
    const result = await this.query<{ primaryKeyColumns: string[] }>(
      connection,
      PostgresService.PRIMARY_KEY_SQL,
      [object.schema, object.name]
    );

    return result.rows[0]?.primaryKeyColumns ?? null;
  }

  async saveTableChanges(connection: PostgresConnection, changes: PostgresTableChanges) {
    const table = this.toTableName(changes);

    await this.withTransaction(connection, async client => {
      for (const update of changes.updates) {
        const assignments = update.values
          .map((cell, index) => `${escapeIdentifier(cell.column)} = $${index + 1}`)
          .join(', ');
        const condition = this.toKeyCondition(update.key, update.values.length);

        await client.query(
          `update ${table} set ${assignments} where ${condition}`,
          [...update.values, ...update.key].map(cell => cell.value)
        );
      }

      for (const insert of changes.inserts) {
        if (!insert.values.length) {
          await client.query(`insert into ${table} default values`);
          continue;
        }

        const columns = insert.values.map(cell => escapeIdentifier(cell.column)).join(', ');
        const placeholders = insert.values.map((_cell, index) => `$${index + 1}`).join(', ');

        await client.query(
          `insert into ${table} (${columns}) values (${placeholders})`,
          insert.values.map(cell => cell.value)
        );
      }
    });
  }

  async deleteTableRows(connection: PostgresConnection, deletion: PostgresRowsDeletion) {
    const table = this.toTableName(deletion);

    return this.withTransaction(connection, async client => {
      let deletedRows = 0;

      for (const key of deletion.keys) {
        const result = await client.query(
          `delete from ${table} where ${this.toKeyCondition(key, 0)}`,
          key.map(cell => cell.value)
        );

        deletedRows += result.rowCount ?? 0;
      }

      return deletedRows;
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
    run: (client: PoolClient) => Promise<T>,
    options?: { discardClient: boolean }
  ): Promise<T> {
    let client: PoolClient;

    if (!this.pools.has(connection.id)) await this.assertPublicHost(connection);

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
      client.release(options?.discardClient);
    }
  }

  private async withTransaction<T>(
    connection: PostgresConnection,
    run: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    return this.withClient(connection, async client => {
      await client.query('begin');

      try {
        const result = await run(client);

        await client.query('commit');

        return result;
      } catch (error) {
        await client.query('rollback');

        throw error;
      }
    });
  }

  private streamQuery(client: PoolClient, sql: string) {
    return new Promise<{
      results: PostgresStreamedResult[];
      rowsByResult: Map<PostgresStreamedResult, PostgresStreamedRows>;
    }>((resolve, reject) => {
      const rowsByResult = new Map<PostgresStreamedResult, PostgresStreamedRows>();
      const query = client.query(
        new Query<PostgresRow>({
          text: sql,
          rowMode: 'array',
          types: { getTypeParser: () => (value: string) => value }
        })
      );

      query.on('row', (row: PostgresRow, result?: PostgresStreamedResult) => {
        if (!result) return;

        const streamed = rowsByResult.get(result) ?? { rows: [], count: 0 };

        if (streamed.count < PostgresService.MAX_RESULT_ROWS) streamed.rows.push(row);
        streamed.count += 1;
        rowsByResult.set(result, streamed);
      });
      query.on('error', reject);
      query.on('end', (response: PostgresStreamedResult | PostgresStreamedResult[]) =>
        resolve({ results: Array.isArray(response) ? response : [response], rowsByResult })
      );
    });
  }

  private async assertPublicHost(credentials: PostgresCredentials) {
    if (this.config.allowPrivateHosts) return;

    let addresses: string[];

    try {
      addresses = isIP(credentials.host)
        ? [credentials.host]
        : (await lookup(credentials.host, { all: true })).map(entry => entry.address);
    } catch (error) {
      throw new PostgresConnectionFailedError(credentials, this.toReason(error));
    }

    const isPrivate = addresses.some(address =>
      this.privateNetworks.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4')
    );

    if (isPrivate) {
      throw new PostgresConnectionFailedError(credentials, 'host resolves to a private address');
    }
  }

  private toTableName(object: PostgresObject) {
    return `${escapeIdentifier(object.schema)}.${escapeIdentifier(object.name)}`;
  }

  private toKeyCondition(key: PostgresCellValue[], offset: number) {
    return key
      .map((cell, index) => `${escapeIdentifier(cell.column)} = $${offset + index + 1}`)
      .join(' and ');
  }

  private async readResultColumns(
    client: PoolClient,
    fields: FieldDef[]
  ): Promise<PostgresResultColumn[]> {
    if (!fields.length) return [];

    const types = await client.query<{ type: string }>(PostgresService.COLUMN_TYPES_SQL, [
      fields.map(field => field.dataTypeID),
      fields.map(field => field.dataTypeModifier)
    ]);

    return fields.map((field, index) => ({
      name: field.name,
      type: types.rows[index]?.type ?? ''
    }));
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

  private toWhereClause(where: string | null) {
    return where ? `\nwhere (\n${where}\n)` : '';
  }

  private toOrderByClause(orderBy: string | null, primaryKeyColumns: string[]) {
    const terms = [
      ...(orderBy ? [orderBy] : []),
      ...primaryKeyColumns.map(column => escapeIdentifier(column))
    ];

    return terms.length ? `\norder by\n${terms.join('\n, ')}` : '';
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
