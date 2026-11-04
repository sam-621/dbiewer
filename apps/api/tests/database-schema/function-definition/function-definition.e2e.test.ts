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

const FUNCTION_DEFINITION_QUERY = /* GraphQL */ `
  query FunctionDefinition($input: FunctionDefinitionInput!) {
    functionDefinition(input: $input) {
      apiErrors {
        code
        message
      }
      definition
    }
  }
`;

type FunctionDefinitionResponse = {
  functionDefinition: {
    apiErrors: Array<{ code: string; message: string }>;
    definition: string | null;
  };
};

const BOOK_COUNT_INPUT = {
  connectionId: ConnectionConstants.ProductionConnectionId,
  schema: 'inventory',
  name: 'book_count',
  arguments: 'author integer'
};

describe('functionDefinition', () => {
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

  test('returns the definition of the function', async () => {
    vi.spyOn(PostgresService.prototype, 'readFunctionDefinition').mockResolvedValue(
      'CREATE OR REPLACE FUNCTION inventory.book_count(author integer)'
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      { input: BOOK_COUNT_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [],
      definition: 'CREATE OR REPLACE FUNCTION inventory.book_count(author integer)'
    });
  });

  test('returns OBJECT_NOT_FOUND when the function does not exist', async () => {
    vi.spyOn(PostgresService.prototype, 'readFunctionDefinition').mockResolvedValue(null);
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      { input: BOOK_COUNT_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [
        {
          code: 'OBJECT_NOT_FOUND',
          message: 'Function not found with name inventory.book_count(author integer)'
        }
      ],
      definition: null
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      { input: { ...BOOK_COUNT_INPUT, connectionId: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      definition: null
    });
  });

  test('returns CONNECTION_FAILED when it cannot connect to the database', async () => {
    vi.spyOn(PostgresService.prototype, 'readFunctionDefinition').mockRejectedValue(
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

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      { input: BOOK_COUNT_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_FAILED',
          message:
            'Failed to connect to db.example.com:5432/shop: password authentication failed for user "ada"'
        }
      ],
      definition: null
    });
  });

  test('returns QUERY_FAILED with the message of Postgres when the query fails', async () => {
    vi.spyOn(PostgresService.prototype, 'readFunctionDefinition').mockRejectedValue(
      new PostgresQueryFailedError('canceling statement due to statement timeout')
    );
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      { input: BOOK_COUNT_INPUT },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [
        { code: 'QUERY_FAILED', message: 'canceling statement due to statement timeout' }
      ],
      definition: null
    });
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<FunctionDefinitionResponse>(
      FUNCTION_DEFINITION_QUERY,
      {
        input: {
          ...BOOK_COUNT_INPUT,
          connectionId: ConnectionConstants.OtherWorkspaceConnectionId
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.functionDefinition).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      definition: null
    });
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<FunctionDefinitionResponse>(FUNCTION_DEFINITION_QUERY, {
      input: BOOK_COUNT_INPUT
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
