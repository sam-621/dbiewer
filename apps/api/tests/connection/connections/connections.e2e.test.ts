import { destroyDatabase, loadFixtures, resetDatabase } from '@tests/utils/database';
import { TestServer } from '@tests/utils/test-server';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ConnectionConstants, ConnectionFixtures } from './fixtures/connection.fixtures';
import { UserConstants, UserFixtures } from './fixtures/user.fixtures';
import { WorkspaceFixtures } from './fixtures/workspace.fixtures';

const CONNECTIONS_QUERY = /* GraphQL */ `
  query Connections {
    connections {
      items {
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

type ConnectionsResponse = {
  connections: {
    items: Array<{
      id: string;
      name: string;
      host: string;
      port: number;
      database: string;
      username: string;
      hasPassword: boolean;
      sslMode: string;
    }>;
  } | null;
};

describe('connections', () => {
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

  test('returns the connections of the workspace sorted by newest first without the password', async () => {
    const headers = await testServer.signIn(UserConstants.OwnerEmail);

    const response = await testServer.query<ConnectionsResponse>(CONNECTIONS_QUERY, {}, headers);

    expect(response.errors).toBeUndefined();
    expect(response.data?.connections).toEqual({
      items: [
        {
          id: ConnectionConstants.ProductionConnectionId,
          name: 'Production',
          host: 'db.example.com',
          port: 5432,
          database: 'app',
          username: 'ada',
          hasPassword: true,
          sslMode: 'VERIFY_FULL'
        },
        {
          id: ConnectionConstants.StagingConnectionId,
          name: 'Staging',
          host: 'staging.example.com',
          port: 5432,
          database: 'app',
          username: 'ada',
          hasPassword: false,
          sslMode: 'REQUIRE'
        },
        {
          id: ConnectionConstants.LocalConnectionId,
          name: 'Local',
          host: 'localhost',
          port: 5433,
          database: 'app_dev',
          username: 'postgres',
          hasPassword: false,
          sslMode: 'DISABLE'
        }
      ]
    });
  });

  test('returns an empty list when the workspace has no connections', async () => {
    const headers = await testServer.signIn(UserConstants.EmptyOwnerEmail);

    const response = await testServer.query<ConnectionsResponse>(CONNECTIONS_QUERY, {}, headers);

    expect(response.errors).toBeUndefined();
    expect(response.data?.connections).toEqual({ items: [] });
  });

  test('does not return the connections of another workspace', async () => {
    const headers = await testServer.signIn(UserConstants.OtherOwnerEmail);

    const response = await testServer.query<ConnectionsResponse>(CONNECTIONS_QUERY, {}, headers);

    expect(response.errors).toBeUndefined();
    expect(response.data?.connections?.items.map(item => item.id)).toEqual([
      ConnectionConstants.OtherWorkspaceConnectionId
    ]);
  });

  test('returns UNAUTHENTICATED when there is no session', async () => {
    const response = await testServer.query<ConnectionsResponse>(CONNECTIONS_QUERY);

    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(response.data?.connections).toBeUndefined();
  });
});
