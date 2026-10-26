import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { PostgresSchema } from '@/services/postgres';
import { PostgresService } from '@/services/postgres';
import { PostgresConnectionFailedError } from '@/services/postgres/postgres-errors';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const CONNECTION_SCHEMA_QUERY = /* GraphQL */ `
  query ConnectionSchema($connectionId: ID!) {
    connectionSchema(connectionId: $connectionId) {
      apiErrors {
        code
        message
      }
      schemas {
        name
        tables {
          name
          estimatedRows
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        views {
          name
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        functions {
          name
          arguments
          kind
        }
      }
    }
  }
`;

type DbColumnResponse = {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

type ConnectionSchemaResponse = {
  connectionSchema: {
    apiErrors: Array<{ code: string; message: string }>;
    schemas: Array<{
      name: string;
      tables: Array<{ name: string; estimatedRows: number | null; columns: DbColumnResponse[] }>;
      views: Array<{ name: string; columns: DbColumnResponse[] }>;
      functions: Array<{ name: string; arguments: string; kind: string }>;
    }> | null;
  };
};

const USER_DATABASE_SCHEMAS: PostgresSchema[] = [
  {
    name: 'inventory',
    tables: [
      {
        name: 'products',
        estimatedRows: null,
        columns: [
          { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
          { name: 'warehouse_id', type: 'integer', isPrimaryKey: false, isForeignKey: true },
          { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
        ]
      },
      {
        name: 'warehouses',
        estimatedRows: 3,
        columns: [
          { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
          { name: 'name', type: 'character varying(100)', isPrimaryKey: false, isForeignKey: false }
        ]
      }
    ],
    views: [
      {
        name: 'product_names',
        columns: [
          { name: 'id', type: 'integer', isPrimaryKey: false, isForeignKey: false },
          { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
        ]
      }
    ],
    functions: [
      { name: 'archive_products', arguments: 'IN before_id integer', kind: 'procedure' },
      { name: 'product_count', arguments: 'warehouse integer', kind: 'function' }
    ]
  },
  {
    name: 'public',
    tables: [
      {
        name: 'users',
        estimatedRows: 120,
        columns: [{ name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false }]
      }
    ],
    views: [],
    functions: []
  }
];

describe('connectionSchema', () => {
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

  test('returns the schemas of the database with their tables, views and functions', async () => {
    vi.spyOn(PostgresService.prototype, 'readSchemas').mockResolvedValue(USER_DATABASE_SCHEMAS);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionSchemaResponse>(
      CONNECTION_SCHEMA_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connectionSchema).toEqual({
      apiErrors: [],
      schemas: [
        {
          name: 'inventory',
          tables: [
            {
              name: 'products',
              estimatedRows: null,
              columns: [
                { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
                { name: 'warehouse_id', type: 'integer', isPrimaryKey: false, isForeignKey: true },
                { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
              ]
            },
            {
              name: 'warehouses',
              estimatedRows: 3,
              columns: [
                { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
                {
                  name: 'name',
                  type: 'character varying(100)',
                  isPrimaryKey: false,
                  isForeignKey: false
                }
              ]
            }
          ],
          views: [
            {
              name: 'product_names',
              columns: [
                { name: 'id', type: 'integer', isPrimaryKey: false, isForeignKey: false },
                { name: 'name', type: 'text', isPrimaryKey: false, isForeignKey: false }
              ]
            }
          ],
          functions: [
            { name: 'archive_products', arguments: 'IN before_id integer', kind: 'PROCEDURE' },
            { name: 'product_count', arguments: 'warehouse integer', kind: 'FUNCTION' }
          ]
        },
        {
          name: 'public',
          tables: [
            {
              name: 'users',
              estimatedRows: 120,
              columns: [{ name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false }]
            }
          ],
          views: [],
          functions: []
        }
      ]
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionSchemaResponse>(
      CONNECTION_SCHEMA_QUERY,
      { connectionId: '00000000-0000-0000-0000-000000000099' },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connectionSchema).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      schemas: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'readSchemas').mockRejectedValue(
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

    const response = await testServer.query<ConnectionSchemaResponse>(
      CONNECTION_SCHEMA_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connectionSchema).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      schemas: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionSchemaResponse>(
      CONNECTION_SCHEMA_QUERY,
      { connectionId: ConnectionConstants.OtherWorkspaceConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connectionSchema).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      schemas: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<ConnectionSchemaResponse>(CONNECTION_SCHEMA_QUERY, {
      connectionId: ConnectionConstants.ProductionConnectionId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
