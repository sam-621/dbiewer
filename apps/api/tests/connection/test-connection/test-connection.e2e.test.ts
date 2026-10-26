import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { connection } from '@/persistence/schema';

import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const TEST_CONNECTION_MUTATION = /* GraphQL */ `
  mutation TestConnection($input: TestConnectionInput!) {
    testConnection(input: $input) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`;

type TestConnectionResponse = {
  testConnection: {
    apiErrors: Array<{ code: string; message: string }>;
    success: boolean | null;
  };
};

const getEnv = (name: 'DATABASE_URL') => {
  const url = process.env[name];

  if (!url) throw new Error(`${name} is required for e2e tests`);

  return url;
};

const getTestDatabaseInput = () => {
  const url = new URL(getEnv('DATABASE_URL'));

  return {
    host: url.hostname,
    port: Number(url.port),
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password,
    sslMode: 'DISABLE'
  };
};

const countConnections = async () => (await testDatabase.select().from(connection)).length;

describe('testConnection', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([new UserFixtures(), new WorkspaceFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('returns success when it can connect to the database', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TestConnectionResponse>(
      TEST_CONNECTION_MUTATION,
      { input: getTestDatabaseInput() },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.testConnection).toEqual({ apiErrors: [], success: true });
    expect(await countConnections()).toBe(0);
  });

  test('returns INVALID_INPUT naming the missing fields', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TestConnectionResponse>(
      TEST_CONNECTION_MUTATION,
      {
        input: {
          ...getTestDatabaseInput(),
          host: '   ',
          database: null,
          username: undefined,
          port: null
        }
      },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.testConnection).toEqual({
      apiErrors: [
        {
          code: 'INVALID_INPUT',
          message: [
            '✖ Too small: expected string to have >=1 characters',
            '  → at host',
            '✖ Invalid input: expected number, received null',
            '  → at port',
            '✖ Invalid input: expected string, received null',
            '  → at database',
            '✖ Invalid input: expected string, received undefined',
            '  → at username'
          ].join('\n')
        }
      ],
      success: null
    });
    expect(await countConnections()).toBe(0);
  });

  test('returns success false when the credentials are wrong', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<TestConnectionResponse>(
      TEST_CONNECTION_MUTATION,
      { input: { ...getTestDatabaseInput(), password: 'wrong-password' } },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.testConnection).toEqual({ apiErrors: [], success: false });
    expect(await countConnections()).toBe(0);
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<TestConnectionResponse>(TEST_CONNECTION_MUTATION, {
      input: getTestDatabaseInput()
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });
});
