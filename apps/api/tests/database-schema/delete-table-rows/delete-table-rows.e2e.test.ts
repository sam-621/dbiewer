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

const DELETE_TABLE_ROWS_MUTATION = /* GraphQL */ `
  mutation DeleteTableRows($input: DeleteTableRowsInput!) {
    deleteTableRows(input: $input) {
      apiErrors {
        code
        message
      }
      deletedRows
    }
  }
`;

type DeleteTableRowsResponse = {
  deleteTableRows: {
    apiErrors: Array<{ code: string; message: string }>;
    deletedRows: number | null;
  };
};

const ORDER_ITEMS_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  schema: 'inventory',
  name: 'order_items',
  keys: [
    [
      { column: 'order_id', value: '1' },
      { column: 'line', value: '1' }
    ],
    [
      { column: 'order_id', value: '1' },
      { column: 'line', value: '2' }
    ]
  ]
};

describe('deleteTableRows', () => {
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

  test('returns the number of deleted rows', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue([
      'order_id',
      'line'
    ]);
    vi.spyOn(PostgresService.prototype, 'deleteTableRows').mockResolvedValue(2);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: ORDER_ITEMS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({ apiErrors: [], deletedRows: 2 });
  });

  test('returns INVALID_INPUT when there are no keys', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: { ...ORDER_ITEMS_INPUT, keys: [] } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: '✖ Too small: expected array to have >=1 items\n  → at keys'
        }
      ],
      deletedRows: null
    });
  });

  test('returns OBJECT_NOT_FOUND when the table does not exist or is a view', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue(null);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: ORDER_ITEMS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        { code: 'OBJECT_NOT_FOUND', message: 'Table not found with name inventory.order_items' }
      ],
      deletedRows: null
    });
  });

  test('returns PRIMARY_KEY_REQUIRED when the keys do not have the columns of the primary key', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue([
      'order_id',
      'line'
    ]);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: { ...ORDER_ITEMS_INPUT, keys: [[{ column: 'order_id', value: '1' }]] } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'PRIMARY_KEY_REQUIRED',
          message:
            'Row key must have exactly the primary key columns of inventory.order_items: order_id, line'
        }
      ],
      deletedRows: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: { ...ORDER_ITEMS_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      deletedRows: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockRejectedValue(
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

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: ORDER_ITEMS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      deletedRows: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when a deletion fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue([
      'order_id',
      'line'
    ]);
    vi.spyOn(PostgresService.prototype, 'deleteTableRows').mockRejectedValue(
      new PostgresQueryFailedError(
        'update or delete on table "order_items" violates foreign key constraint "shipments_item_fkey" on table "shipments"'
      )
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      { input: ORDER_ITEMS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'QUERY_FAILED',
          message:
            'update or delete on table "order_items" violates foreign key constraint "shipments_item_fkey" on table "shipments"'
        }
      ],
      deletedRows: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<DeleteTableRowsResponse>(
      DELETE_TABLE_ROWS_MUTATION,
      {
        input: {
          ...ORDER_ITEMS_INPUT,
          connectionId: ConnectionConstants.OtherWorkspaceConnectionId
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.deleteTableRows).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      deletedRows: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<DeleteTableRowsResponse>(DELETE_TABLE_ROWS_MUTATION, {
      input: ORDER_ITEMS_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
