import { afterEach, describe, expect, test } from 'vitest';

import { PostgresConnectionFailedError, PostgresQueryFailedError } from './postgres-errors';
import { PostgresService } from './postgres-service';

const getTestConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) throw new Error('DATABASE_URL is required for integration tests');

  const url = new URL(databaseUrl);

  return {
    id: '00000000-0000-0000-0000-000000000001',
    host: url.hostname,
    port: Number(url.port),
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    sslMode: 'disable' as const
  };
};

const BACKEND_PID_SQL = 'select pg_backend_pid() as pid';

describe('PostgresService', () => {
  const postgresService = new PostgresService();

  afterEach(async () => {
    await postgresService.closePools();
  });

  test('returns the rows of a parameterized query', async () => {
    const result = await postgresService.query<{ value: string }>(
      getTestConnection(),
      'select $1::text as value',
      ['dbiewer']
    );

    expect(result.rows).toEqual([{ value: 'dbiewer' }]);
  });

  test('opens the clients with a statement timeout of 30 seconds', async () => {
    const result = await postgresService.query<{ statement_timeout: string }>(
      getTestConnection(),
      'show statement_timeout'
    );

    expect(result.rows).toEqual([{ statement_timeout: '30s' }]);
  });

  test('reuses the client of the connection pool', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );
    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).toBe(first.rows[0]?.pid);
  });

  test('opens at most 3 clients per connection', async () => {
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        postgresService.query<{ pid: number }>(
          getTestConnection(),
          'select pg_backend_pid() as pid, pg_sleep(0.2)'
        )
      )
    );

    expect(new Set(results.map(result => result.rows[0]?.pid)).size).toBe(3);
  });

  test('opens a new client after the pool is discarded', async () => {
    const first = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    await postgresService.discardPool(getTestConnection().id);

    const second = await postgresService.query<{ pid: number }>(
      getTestConnection(),
      BACKEND_PID_SQL
    );

    expect(second.rows[0]?.pid).not.toBe(first.rows[0]?.pid);
  });

  test('throws PostgresConnectionFailedError when it cannot connect', async () => {
    const connection = { ...getTestConnection(), password: 'wrong-password' };

    await expect(postgresService.query(connection, 'select 1')).rejects.toThrow(
      PostgresConnectionFailedError
    );
  });

  test('throws PostgresQueryFailedError with the message of Postgres when the query fails', async () => {
    const query = postgresService.query(getTestConnection(), 'select * from missing_table');

    await expect(query).rejects.toThrow(PostgresQueryFailedError);
    await expect(query).rejects.toThrow('relation "missing_table" does not exist');
  });
});
