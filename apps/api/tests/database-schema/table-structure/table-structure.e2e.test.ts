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

const TABLE_STRUCTURE_QUERY = /* GraphQL */ `
  query TableStructure($input: DbObjectInput!) {
    tableStructure(input: $input) {
      apiErrors {
        code
        message
      }
      structure {
        columns {
          name
          type
          isNullable
          default
          isPrimaryKey
        }
        indexes {
          name
          definition
          isUnique
        }
        foreignKeys {
          columns
          referencedSchema
          referencedTable
          referencedColumns
          onDelete
        }
        definition
      }
    }
  }
`;

type TableStructureResponse = {
  tableStructure: {
    apiErrors: Array<{ code: string; message: string }>;
    structure: {
      columns: Array<{
        name: string;
        type: string;
        isNullable: boolean;
        default: string | null;
        isPrimaryKey: boolean;
      }>;
      indexes: Array<{ name: string; definition: string; isUnique: boolean }>;
      foreignKeys: Array<{
        columns: string[];
        referencedSchema: string;
        referencedTable: string;
        referencedColumns: string[];
        onDelete: string;
      }>;
      definition: string;
    } | null;
  };
};

const PRODUCTS_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  schema: 'inventory',
  name: 'products'
};

describe('tableStructure', () => {
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

  test('returns the columns, indexes, foreign keys and definition of the table', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue({
      columns: [
        { name: 'id', type: 'integer', isNullable: false, default: null, isPrimaryKey: true },
        {
          name: 'warehouse_id',
          type: 'integer',
          isNullable: true,
          default: null,
          isPrimaryKey: false
        },
        {
          name: 'name',
          type: 'text',
          isNullable: false,
          default: "'unnamed'::text",
          isPrimaryKey: false
        }
      ],
      indexes: [
        {
          name: 'products_pkey',
          definition: 'CREATE UNIQUE INDEX products_pkey ON inventory.products USING btree (id)',
          isUnique: true
        }
      ],
      foreignKeys: [
        {
          columns: ['warehouse_id'],
          referencedSchema: 'inventory',
          referencedTable: 'warehouses',
          referencedColumns: ['id'],
          onDelete: 'NO ACTION'
        }
      ],
      definition: 'CREATE TABLE "inventory"."products" (\n  "id" integer NOT NULL\n);'
    });
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [],
      structure: {
        columns: [
          { name: 'id', type: 'integer', isNullable: false, default: null, isPrimaryKey: true },
          {
            name: 'warehouse_id',
            type: 'integer',
            isNullable: true,
            default: null,
            isPrimaryKey: false
          },
          {
            name: 'name',
            type: 'text',
            isNullable: false,
            default: "'unnamed'::text",
            isPrimaryKey: false
          }
        ],
        indexes: [
          {
            name: 'products_pkey',
            definition: 'CREATE UNIQUE INDEX products_pkey ON inventory.products USING btree (id)',
            isUnique: true
          }
        ],
        foreignKeys: [
          {
            columns: ['warehouse_id'],
            referencedSchema: 'inventory',
            referencedTable: 'warehouses',
            referencedColumns: ['id'],
            onDelete: 'NO ACTION'
          }
        ],
        definition: 'CREATE TABLE "inventory"."products" (\n  "id" integer NOT NULL\n);'
      }
    });
  });

  test('returns OBJECT_NOT_FOUND when the table does not exist', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockResolvedValue(null);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [
        {
          code: 'OBJECT_NOT_FOUND',
          message: 'Table or view not found with name inventory.products'
        }
      ],
      structure: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      { input: { ...PRODUCTS_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      structure: null
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

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      structure: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when the query fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readTableStructure').mockRejectedValue(
      new PostgresQueryFailedError('canceling statement due to statement timeout')
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      { input: PRODUCTS_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [
        { code: 'QUERY_FAILED', message: 'canceling statement due to statement timeout' }
      ],
      structure: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TableStructureResponse>(
      TABLE_STRUCTURE_QUERY,
      {
        input: { ...PRODUCTS_INPUT, connectionId: ConnectionConstants.OtherWorkspaceConnectionId }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.tableStructure).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      structure: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<TableStructureResponse>(TABLE_STRUCTURE_QUERY, {
      input: PRODUCTS_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
