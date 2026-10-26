import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const CONNECTION_QUERY = /* GraphQL */ `
  query Connection($id: ID!) {
    connection(id: $id) {
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
`;

type ConnectionResponse = {
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

describe('connection', () => {
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

  test('returns the connection without the password', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionResponse>(
      CONNECTION_QUERY,
      { id: ConnectionConstants.ProductionConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connection).toEqual({
      id: ConnectionConstants.ProductionConnectionId,
      name: 'Production',
      host: 'db.example.com',
      port: 5432,
      database: 'app',
      username: 'ada',
      hasPassword: true,
      sslMode: 'VERIFY_FULL'
    });
  });

  test('returns null when the connection does not exist', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionResponse>(
      CONNECTION_QUERY,
      { id: crypto.randomUUID() },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connection).toBeNull();
  });

  test('returns null for a connection of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionResponse>(
      CONNECTION_QUERY,
      { id: ConnectionConstants.OtherWorkspaceConnectionId },
      headers
    );

    expect(response.errors).toBeUndefined();
    expect(response.data?.connection).toBeNull();
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<ConnectionResponse>(CONNECTION_QUERY, {
      id: ConnectionConstants.ProductionConnectionId
    });

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(response.data?.connection).toBeNull();
  });
});
