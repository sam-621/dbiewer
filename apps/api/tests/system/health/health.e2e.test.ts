import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { destroyDatabase, loadFixtures, resetDatabase } from '../../utils/database';
import { TestServer } from '../../utils/test-server';

const HEALTH_QUERY = /* GraphQL */ `
  query Health {
    health
  }
`;

describe('health', () => {
  const testServer = new TestServer();

  beforeEach(async () => {
    await loadFixtures([]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
    await testServer.teardown();
  });

  test('returns true when the server is up', async () => {
    const response = await testServer.query<{ health: boolean }>(HEALTH_QUERY);

    expect(response.errors).toBeUndefined();
    expect(response.data?.health).toBe(true);
  });
});
