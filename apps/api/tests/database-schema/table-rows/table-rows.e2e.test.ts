import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { PostgresTableStructure } from '@/services/postgres';
import { PostgresService } from '@/services/postgres';
import {
  PostgresConnectionFailedError,
  PostgresQueryFailedError
} from '@/services/postgres/postgres-errors';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const TABLE_ROWS_QUERY = /* GraphQL */ `
  query TableRows($input: TableRowsInput!) {
    tableRows(input: $input) {
      apiErrors {
        code
        message
      }
      tableRows {
        columns {
          name
          type
        }
        rows
        totalRows
      }
    }
  }
`;

type TableRowsResponse = {
  tableRows: {
    apiErrors: Array<{ code: string; message: string }>;
    tableRows: {
      columns: Array<{ name: string; type: string }>;
      rows: Array<Array<string | null>>;
      totalRows: number;
    } | null;
  };
};

const PRODUCTS_STRUCTURE: PostgresTableStructure = {
  columns: [
    { name: 'id', type: 'integer', isNullable: false, default: null, isPrimaryKey: true },
    { name: 'name', type: 'text', isNullable: false, default: null, isPrimaryKey: false },
    { name: 'price', type: 'numeric(10,2)', isNullable: true, default: null, isPrimaryKey: false }
  ],
  indexes: [],
  foreignKeys: [],
  definition: 'CREATE TABLE "inventory"."products" ();'
};

const PRODUCTS_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  schema: 'inventory',
  name: 'products',
  filters: [{ column: 'name', operator: 'CONTAINS', value: 'lamp' }],
  orderBy: { column: 'price', direction: 'DESC' },
  page: 2
};

describe('tableRows', () => {
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

  test('returns the columns, the rows of the page and the total of rows', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue(PRODUCTS_STRUCTURE);
    vi.spyOn(PostgresService.prototype, 'readTableRows').mockResolvedValue({
      rows: [
        ['51', 'Desk lamp', '19.99'],
        ['52', 'Floor lamp', null]
      ],
      totalRows: 52
    });
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [],
      tableRows: {
        columns: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'text' },
          { name: 'price', type: 'numeric(10,2)' }
        ],
        rows: [
          ['51', 'Desk lamp', '19.99'],
          ['52', 'Floor lamp', null]
        ],
        totalRows: 52
      }
    });
  });

  test('returns INVALID_INPUT when a filter uses a column that does not exist', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue(PRODUCTS_STRUCTURE);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      {
        input: {
          ...PRODUCTS_INPUT,
          filters: [{ column: 'stock', operator: 'GT', value: '0' }]
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        { code: 'INVALID_INPUT', message: 'Column stock does not exist in inventory.products' }
      ],
      tableRows: null
    });
  });

  test('returns INVALID_INPUT when the page is lower than 1', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      { input: { ...PRODUCTS_INPUT, page: 0 } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        { code: 'INVALID_INPUT', message: '✖ Too small: expected number to be >=1\n  → at page' }
      ],
      tableRows: null
    });
  });

  test('returns OBJECT_NOT_FOUND when the table does not exist', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue(null);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        {
          code: 'OBJECT_NOT_FOUND',
          message: 'Table or view not found with name inventory.products'
        }
      ],
      tableRows: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      { input: { ...PRODUCTS_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      tableRows: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockRejectedValue(
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

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      tableRows: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when the query fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue(PRODUCTS_STRUCTURE);
    vi.spyOn(PostgresService.prototype, 'readTableRows').mockRejectedValue(
      new PostgresQueryFailedError('invalid input syntax for type numeric: "cheap"')
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      {
        input: {
          ...PRODUCTS_INPUT,
          filters: [{ column: 'price', operator: 'LT', value: 'cheap' }]
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        { code: 'QUERY_FAILED', message: 'invalid input syntax for type numeric: "cheap"' }
      ],
      tableRows: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableRowsResponse>(
      TABLE_ROWS_QUERY,
      {
        input: { ...PRODUCTS_INPUT, connectionId: ConnectionConstants.OtherWorkspaceConnectionId }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      tableRows: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<TableRowsResponse>(TABLE_ROWS_QUERY, {
      input: PRODUCTS_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
