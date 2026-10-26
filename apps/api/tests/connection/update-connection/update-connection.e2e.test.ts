import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { connection } from '@/persistence/schema';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const UPDATE_CONNECTION_MUTATION = /* GraphQL */ `
  mutation UpdateConnection($input: UpdateConnectionInput!) {
    updateConnection(input: $input) {
      apiErrors {
        code
        message
      }
      connection {
        id
        name
        host
        port
        database
        username
        hasPassword
        sslMode
      }
    }
  }
`;

type UpdateConnectionResponse = {
  updateConnection: {
    apiErrors: Array<{ code: string; message: string }>;
    connection: {
      id: string;
      name: string;
      host: string;
      port: number;
      database: string;
      username: string;
      hasPassword: boolean;
      sslMode: string;
    } | null;
  };
};

const validInput = {
  id: ConnectionConstants.ProductionConnectionId,
  name: 'Production replica',
  host: 'replica.example.com',
  port: 5433,
  database: 'app_replica',
  username: 'grace',
  sslMode: 'DISABLE'
};

const findConnection = async (id: string) => {
  const [row] = await testDatabase.select().from(connection).where(eq(connection.id, id));

  return row;
};

describe('updateConnection', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures(), new ConnectionFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('updates the connection trimmed and keeps the password when it is not sent', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<UpdateConnectionResponse>(
      UPDATE_CONNECTION_MUTATION,
      {
        input: {
          ...validInput,
          name: '  Production replica  ',
          host: ' replica.example.com ',
          database: ' app_replica ',
          username: ' grace '
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateConnection).toEqual({
      apiErrors: [],
      connection: {
        id: ConnectionConstants.ProductionConnectionId,
        name: 'Production replica',
        host: 'replica.example.com',
        port: 5433,
        database: 'app_replica',
        username: 'grace',
        hasPassword: true,
        sslMode: 'DISABLE'
      }
    });
    expect(JSON.stringify(response)).not.toContain('v1:iv:tag:ciphertext');
    expect(await findConnection(ConnectionConstants.ProductionConnectionId)).toMatchObject({
      name: 'Production replica',
      host: 'replica.example.com',
      port: 5433,
      database: 'app_replica',
      username: 'grace',
      passwordEncrypted: 'v1:iv:tag:ciphertext',
      sslMode: 'disable'
    });
  });

  test('returns CONNECTION_NOT_FOUND when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<UpdateConnectionResponse>(
      UPDATE_CONNECTION_MUTATION,
      { input: { ...validInput, id: '00000000-0000-0000-0000-000000000099' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found with id 00000000-0000-0000-0000-000000000099'
        }
      ],
      connection: null
    });
  });

  test('returns INVALID_INPUT when the name is blank', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<UpdateConnectionResponse>(
      UPDATE_CONNECTION_MUTATION,
      { input: { ...validInput, name: '   ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateConnection).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: '✖ Too small: expected string to have >=1 characters\n  → at name'
        }
      ],
      connection: null
    });
    expect((await findConnection(ConnectionConstants.ProductionConnectionId))?.name).toBe(
      'Production'
    );
  });

  test('returns CONNECTION_NAME_ALREADY_EXISTS when another connection has the name ignoring case', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<UpdateConnectionResponse>(
      UPDATE_CONNECTION_MUTATION,
      { input: { ...validInput, name: ' staging ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NAME_ALREADY_EXISTS',
          message: 'Connection name staging already exists'
        }
      ],
      connection: null
    });
    expect((await findConnection(ConnectionConstants.ProductionConnectionId))?.name).toBe(
      'Production'
    );
  });

  test('returns CONNECTION_NOT_FOUND for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<UpdateConnectionResponse>(
      UPDATE_CONNECTION_MUTATION,
      { input: { ...validInput, id: ConnectionConstants.OtherWorkspaceConnectionId } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.updateConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NOT_FOUND',
          message: `Connection not found with id ${ConnectionConstants.OtherWorkspaceConnectionId}`
        }
      ],
      connection: null
    });
    expect((await findConnection(ConnectionConstants.OtherWorkspaceConnectionId))?.name).toBe(
      'Analytics'
    );
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<UpdateConnectionResponse>(UPDATE_CONNECTION_MUTATION, {
      input: validInput
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect((await findConnection(ConnectionConstants.ProductionConnectionId))?.name).toBe(
      'Production'
    );
  });
});
