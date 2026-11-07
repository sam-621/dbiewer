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

const SAVE_TABLE_CHANGES_MUTATION = /* GraphQL */ `
  mutation SaveTableChanges($input: SaveTableChangesInput!) {
    saveTableChanges(input: $input) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`;

type SaveTableChangesResponse = {
  saveTableChanges: {
    apiErrors: Array<{ code: string; message: string }>;
    success: boolean | null;
  };
};

const PRODUCTS_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  schema: 'inventory',
  name: 'products',
  updates: [
    {
      key: [{ column: 'id', value: '1' }],
      values: [
        { column: 'name', value: 'Desk lamp' },
        { column: 'price', value: null }
      ]
    }
  ],
  inserts: [{ values: [{ column: 'name', value: 'Floor lamp' }] }, { values: [] }]
};

describe('saveTableChanges', () => {
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

  test('returns success when the changes are saved', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue(['id']);
    vi.spyOn(PostgresService.prototype, 'saveTableChanges').mockResolvedValue();
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({ apiErrors: [], success: true });
  });

  test('returns INVALID_INPUT when there are no updates or inserts', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: { ...PRODUCTS_INPUT, updates: [], inserts: [] } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        { code: 'INVALID_INPUT', message: '✖ There must be at least one update or insert' }
      ],
      success: null
    });
  });

  test('returns OBJECT_NOT_FOUND when the table does not exist or is a view', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue(null);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        { code: 'OBJECT_NOT_FOUND', message: 'Table not found with name inventory.products' }
      ],
      success: null
    });
  });

  test('returns PRIMARY_KEY_REQUIRED when the table has no primary key', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue([]);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        { code: 'PRIMARY_KEY_REQUIRED', message: 'Table inventory.products has no primary key' }
      ],
      success: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: { ...PRODUCTS_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      success: null
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

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      success: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when a statement fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readPrimaryKeyColumns').mockResolvedValue(['id']);
    vi.spyOn(PostgresService.prototype, 'saveTableChanges').mockRejectedValue(
      new PostgresQueryFailedError(
        'null value in column "name" of relation "products" violates not-null constraint'
      )
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        {
          code: 'QUERY_FAILED',
          message: 'null value in column "name" of relation "products" violates not-null constraint'
        }
      ],
      success: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SaveTableChangesResponse>(
      SAVE_TABLE_CHANGES_MUTATION,
      {
        input: { ...PRODUCTS_INPUT, connectionId: ConnectionConstants.OtherWorkspaceConnectionId }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.saveTableChanges).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      success: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<SaveTableChangesResponse>(SAVE_TABLE_CHANGES_MUTATION, {
      input: PRODUCTS_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
