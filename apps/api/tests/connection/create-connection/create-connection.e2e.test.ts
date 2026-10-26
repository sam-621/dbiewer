import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { config } from '@/config';
import { connection } from '@/persistence/schema';
import { EncryptionService } from '@/services/encryption';

import { ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceConstants, WorkspaceFixtures } from './fixtures/workspace.fixtures';

const CREATE_CONNECTION_MUTATION = /* GraphQL */ `
  mutation CreateConnection($input: CreateConnectionInput!) {
    createConnection(input: $input) {
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

type CreateConnectionResponse = {
  createConnection: {
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
  name: 'Staging',
  host: 'staging.example.com',
  port: 5433,
  database: 'app',
  username: 'ada',
  password: 'super-secret-password',
  sslMode: 'REQUIRE'
};

const findConnectionsOf = (workspaceId: string) =>
  testDatabase.select().from(connection).where(eq(connection.tenantId, workspaceId));

const encryptionService = new EncryptionService(config.encryption.connectionsKey);

describe('createConnection', () => {
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

  test('adds the connection trimmed with the password encrypted', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<CreateConnectionResponse>(
      CREATE_CONNECTION_MUTATION,
      {
        input: {
          ...validInput,
          name: '  Staging  ',
          host: ' staging.example.com ',
          database: ' app ',
          username: ' ada ',
          password: '  super-secret-password  ',
          sslMode: 'VERIFY_FULL'
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createConnection).toEqual({
      apiErrors: [],
      connection: {
        id: expect.any(String),
        name: 'Staging',
        host: 'staging.example.com',
        port: 5433,
        database: 'app',
        username: 'ada',
        hasPassword: true,
        sslMode: 'VERIFY_FULL'
      }
    });
    expect(JSON.stringify(response)).not.toContain('super-secret-password');

    const [created] = await testDatabase
      .select()
      .from(connection)
      .where(eq(connection.name, 'Staging'));

    expect(created).toMatchObject({
      id: response.data?.createConnection.connection?.id,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      name: 'Staging',
      host: 'staging.example.com',
      port: 5433,
      database: 'app',
      username: 'ada',
      sslMode: 'verify-full'
    });
    expect(created?.passwordEncrypted).toMatch(/^v1:/);
    expect(encryptionService.decrypt(created?.passwordEncrypted ?? '', created?.id ?? '')).toBe(
      '  super-secret-password  '
    );
  });

  test('returns INVALID_INPUT when the name is blank', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<CreateConnectionResponse>(
      CREATE_CONNECTION_MUTATION,
      { input: { ...validInput, name: '   ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createConnection).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: '✖ Too small: expected string to have >=1 characters\n  → at name'
        }
      ],
      connection: null
    });
    expect(await findConnectionsOf(WorkspaceConstants.OwnerWorkspaceId)).toHaveLength(1);
  });

  test('returns CONNECTION_NAME_ALREADY_EXISTS when the name is taken ignoring case', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<CreateConnectionResponse>(
      CREATE_CONNECTION_MUTATION,
      { input: { ...validInput, name: ' PRODUCTION ' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createConnection).toEqual({
      apiErrors: [
        {
          code: 'CONNECTION_NAME_ALREADY_EXISTS',
          message: 'Connection name PRODUCTION already exists'
        }
      ],
      connection: null
    });
    expect(await findConnectionsOf(WorkspaceConstants.OwnerWorkspaceId)).toHaveLength(1);
  });

  test('does not check the name against connections of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<CreateConnectionResponse>(
      CREATE_CONNECTION_MUTATION,
      { input: { ...validInput, name: 'Analytics' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.createConnection.apiErrors).toEqual([]);
    expect(await findConnectionsOf(WorkspaceConstants.OwnerWorkspaceId)).toHaveLength(2);
    expect(await findConnectionsOf(WorkspaceConstants.OtherOwnerWorkspaceId)).toHaveLength(1);
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<CreateConnectionResponse>(CREATE_CONNECTION_MUTATION, {
      input: validInput
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(await findConnectionsOf(WorkspaceConstants.OwnerWorkspaceId)).toHaveLength(1);
  });
});
