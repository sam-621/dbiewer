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

const SCHEMA_DIAGRAM_QUERY = /* GraphQL */ `
  query SchemaDiagram($connectionId: ID!) {
    schemaDiagram(connectionId: $connectionId) {
      apiErrors {
        code
        message
      }
      diagram {
        entities {
          id
          schema
          name
          properties {
            name
            type
            default
            isNullable
            isPrimaryKey
            isForeignKey
          }
        }
        relations {
          id
          type
          fromEntityId
          fromProperties
          toEntityId
          toProperties
        }
      }
    }
  }
`;

type SchemaDiagramResponse = {
  schemaDiagram: {
    apiErrors: Array<{ code: string; message: string }>;
    diagram: {
      entities: Array<{
        id: string;
        schema: string;
        name: string;
        properties: Array<{
          name: string;
          type: string;
          default: string | null;
          isNullable: boolean;
          isPrimaryKey: boolean;
          isForeignKey: boolean;
        }>;
      }>;
      relations: Array<{
        id: string;
        type: string;
        fromEntityId: string;
        fromProperties: string[];
        toEntityId: string;
        toProperties: string[];
      }>;
    } | null;
  };
};

describe('schemaDiagram', () => {
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

  test('returns the entities and relations of the connection', async () => {
    vi.spyOn(PostgresService.prototype, 'readDiagram').mockResolvedValue({
      entities: [
        {
          id: 'inventory.products',
          schema: 'inventory',
          name: 'products',
          properties: [
            {
              name: 'id',
              type: 'integer',
              default: null,
              isNullable: false,
              isPrimaryKey: true,
              isForeignKey: false
            },
            {
              name: 'status',
              type: 'text',
              default: "'active'::text",
              isNullable: false,
              isPrimaryKey: false,
              isForeignKey: false
            }
          ]
        },
        {
          id: 'sales.order_lines',
          schema: 'sales',
          name: 'order_lines',
          properties: [
            {
              name: 'product_id',
              type: 'integer',
              default: null,
              isNullable: true,
              isPrimaryKey: false,
              isForeignKey: true
            }
          ]
        }
      ],
      relations: [
        {
          id: 'sales.order_lines.order_lines_product_id_fkey',
          type: 'MANY_TO_ONE',
          fromEntityId: 'sales.order_lines',
          fromProperties: ['product_id'],
          toEntityId: 'inventory.products',
          toProperties: ['id']
        },
        {
          id: 'sales.order_lines.order_lines_warehouse_id_sku_fkey',
          type: 'ONE_TO_ONE',
          fromEntityId: 'sales.order_lines',
          fromProperties: ['warehouse_id', 'sku'],
          toEntityId: 'inventory.products',
          toProperties: ['warehouse_id', 'sku']
        }
      ]
    });
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SchemaDiagramResponse>(
      SCHEMA_DIAGRAM_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.schemaDiagram).toEqual({
      apiErrors: [],
      diagram: {
        entities: [
          {
            id: 'inventory.products',
            schema: 'inventory',
            name: 'products',
            properties: [
              {
                name: 'id',
                type: 'integer',
                default: null,
                isNullable: false,
                isPrimaryKey: true,
                isForeignKey: false
              },
              {
                name: 'status',
                type: 'text',
                default: "'active'::text",
                isNullable: false,
                isPrimaryKey: false,
                isForeignKey: false
              }
            ]
          },
          {
            id: 'sales.order_lines',
            schema: 'sales',
            name: 'order_lines',
            properties: [
              {
                name: 'product_id',
                type: 'integer',
                default: null,
                isNullable: true,
                isPrimaryKey: false,
                isForeignKey: true
              }
            ]
          }
        ],
        relations: [
          {
            id: 'sales.order_lines.order_lines_product_id_fkey',
            type: 'MANY_TO_ONE',
            fromEntityId: 'sales.order_lines',
            fromProperties: ['product_id'],
            toEntityId: 'inventory.products',
            toProperties: ['id']
          },
          {
            id: 'sales.order_lines.order_lines_warehouse_id_sku_fkey',
            type: 'ONE_TO_ONE',
            fromEntityId: 'sales.order_lines',
            fromProperties: ['warehouse_id', 'sku'],
            toEntityId: 'inventory.products',
            toProperties: ['warehouse_id', 'sku']
          }
        ]
      }
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SchemaDiagramResponse>(
      SCHEMA_DIAGRAM_QUERY,
      { connectionId: '00000000-0000-0000-0000-000000000099' },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.schemaDiagram).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      diagram: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'readDiagram').mockRejectedValue(
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

    const response = await testServer.query<SchemaDiagramResponse>(
      SCHEMA_DIAGRAM_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.schemaDiagram).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      diagram: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when the query fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readDiagram').mockRejectedValue(
      new PostgresQueryFailedError('canceling statement due to statement timeout')
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SchemaDiagramResponse>(
      SCHEMA_DIAGRAM_QUERY,
      { connectionId: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.schemaDiagram).toEqual({
      apiErrors: [
        { code: 'QUERY_FAILED', message: 'canceling statement due to statement timeout' }
      ],
      diagram: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<SchemaDiagramResponse>(
      SCHEMA_DIAGRAM_QUERY,
      { connectionId: ConnectionConstants.OtherWorkspaceConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.schemaDiagram).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      diagram: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<SchemaDiagramResponse>(SCHEMA_DIAGRAM_QUERY, {
      connectionId: ConnectionConstants.ProductionConnectionId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
