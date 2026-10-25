import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { MagicLinkRequestRepository } from '@/persistence/repositories/magic-link-request';
import { magicLinkRequest } from '@/persistence/schema';

import {
  MagicLinkRequestConstants,
  MagicLinkRequestFixtures
} from './fixtures/magic-link-request.fixtures';

describe('MagicLinkRequestRepository', () => {
  const repository = new MagicLinkRequestRepository(testDatabase);

  beforeEach(async () => {
    await loadFixtures([new MagicLinkRequestFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  describe('countSince', () => {
    test('returns the requests of the email since the date, ignoring case', async () => {
      const total = await repository.countSince('ADA@example.com', MagicLinkRequestConstants.Since);

      expect(total).toBe(2);
    });

    test('returns zero for an email without requests', async () => {
      const total = await repository.countSince(
        MagicLinkRequestConstants.NewEmail,
        MagicLinkRequestConstants.Since
      );

      expect(total).toBe(0);
    });
  });

  describe('create', () => {
    test('adds a request for the email', async () => {
      const created = await repository.create(MagicLinkRequestConstants.NewEmail);

      const rows = await testDatabase
        .select()
        .from(magicLinkRequest)
        .where(eq(magicLinkRequest.email, MagicLinkRequestConstants.NewEmail));

      expect(rows).toEqual([created]);
    });

    test('adds a request that counts since now', async () => {
      const since = new Date(Date.now() - 1000);

      await repository.create(MagicLinkRequestConstants.NewEmail);

      expect(await repository.countSince(MagicLinkRequestConstants.NewEmail, since)).toBe(1);
    });
  });
});
