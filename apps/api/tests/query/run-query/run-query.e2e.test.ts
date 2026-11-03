import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { PostgresService } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const RUN_QUERY_MUTATION = /* GraphQL */ `
  mutation RunQuery($input: RunQueryInput!) {
    runQuery(input: $input) {
      apiErrors {
        code
        message
      }
      execution {
        columns {
          name
          type
        }
        rows
        rowCount
        isTruncated
        durationMs
        command
      }
    }
  }
`;

type RunQueryResponse = {
  runQuery: {
    apiErrors: Array<{ code: string; message: string }>;
    execution: {
      columns: Array<{ name: string; type: string }>;
      rows: Array<Array<string | null>>;
      rowCount: number;
      isTruncated: boolean;
      durationMs: number;
      command: string;
    } | null;
  };
};

const RUN_QUERY_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  sql: "update products set price = 10 where id = 1; select id, name, price from products where name ilike '%lamp%';"
};

describe('runQuery', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures(), new ConnectionFixtures()]);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('returns the rows of the last result with rows, truncated to the limit', async () => {
    vi.spyOn(PostgresService.prototype, 'runQuery').mockResolvedValue({
      columns: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'text' },
        { name: 'price', type: 'numeric(10,2)' }
      ],
      rows: [
        ['1', 'Desk lamp', '10.00'],
        ['2', 'Floor lamp', null]
      ],
      rowCount: 1500,
      isTruncated: true,
      durationMs: 42,
      command: 'SELECT 1500'
    });
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      { input: RUN_QUERY_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [],
      execution: {
        columns: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'text' },
          { name: 'price', type: 'numeric(10,2)' }
        ],
        rows: [
          ['1', 'Desk lamp', '10.00'],
          ['2', 'Floor lamp', null]
        ],
        rowCount: 1500,
        isTruncated: true,
        durationMs: 42,
        command: 'SELECT 1500'
      }
    });
  });

  test('returns INVALID_INPUT when the sql is longer than 100,000 characters', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      { input: { ...RUN_QUERY_INPUT, sql: `select '${'a'.repeat(100_000)}'` } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: '✖ Too big: expected string to have <=100000 characters\n  → at sql'
        }
      ],
      execution: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when the query fails', async () => {
    vi.spyOn(PostgresService.prototype, 'runQuery').mockRejectedValue(
      new PostgresQueryFailedError('relation "products" does not exist')
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      { input: RUN_QUERY_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [{ code: 'QUERY_FAILED', message: 'relation "products" does not exist' }],
      execution: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      { input: { ...RUN_QUERY_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      execution: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'runQuery').mockRejectedValue(
      new PostgresConnectionFailedError(
        {
          host: 'db.example.com',
          port: 5432,
          database: 'shop',
          username: 'ada',
          password: null,
          sslMode: 'require'
        },
        'password authentication failed for user "ada"'
      )
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      { input: RUN_QUERY_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      execution: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<RunQueryResponse>(
      RUN_QUERY_MUTATION,
      {
        input: {
          ...RUN_QUERY_INPUT,
          connectionId: ConnectionConstants.OtherWorkspaceConnectionId
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.runQuery).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      execution: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<RunQueryResponse>(RUN_QUERY_MUTATION, {
      input: RUN_QUERY_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
