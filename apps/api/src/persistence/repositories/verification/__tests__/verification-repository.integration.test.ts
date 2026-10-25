import { destroyDatabase, loadFixtures, resetDatabase, testDatabase } from '@tests/utils/database';
import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest';

import { VerificationRepository } from '@/persistence/repositories/verification';
import { verification } from '@/persistence/schema';

import { VerificationConstants, VerificationFixtures } from './fixtures/verification.fixtures';

describe('VerificationRepository', () => {
  const repository = new VerificationRepository(testDatabase);

  beforeEach(async () => {
    await loadFixtures([new VerificationFixtures()]);
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await destroyDatabase();
  });

  describe('removeMagicLink', () => {
    test('removes the magic link of the token', async () => {
      await repository.removeMagicLink(VerificationConstants.MagicLinkToken);

      const rows = await testDatabase
        .select()
        .from(verification)
        .where(eq(verification.id, VerificationConstants.MagicLinkId));

      expect(rows).toHaveLength(0);
    });

    test('does not remove other verifications', async () => {
      await repository.removeMagicLink(VerificationConstants.MagicLinkToken);

      const rows = await testDatabase.select({ id: verification.id }).from(verification);

      expect(rows.map(row => row.id).sort()).toEqual(
        [VerificationConstants.OtherMagicLinkId, VerificationConstants.EmailVerificationId].sort()
      );
    });
  });
});
