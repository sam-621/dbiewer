import type { Fixture } from '@tests/utils/fixture';

import { verification } from '@/persistence/schema';

const MAGIC_LINK_ID = crypto.randomUUID();
const OTHER_MAGIC_LINK_ID = crypto.randomUUID();
const EMAIL_VERIFICATION_ID = crypto.randomUUID();

export const VerificationConstants = {
  MagicLinkId: MAGIC_LINK_ID,
  MagicLinkToken: 'magic-link-token',
  OtherMagicLinkId: OTHER_MAGIC_LINK_ID,
  EmailVerificationId: EMAIL_VERIFICATION_ID
};

const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

export class VerificationFixtures implements Fixture<typeof verification> {
  table = verification;

  rows: (typeof verification)['$inferInsert'][] = [
    {
      id: MAGIC_LINK_ID,
      identifier: `magic-link:${VerificationConstants.MagicLinkToken}`,
      value: JSON.stringify({ email: 'ada@example.com' }),
      expiresAt
    },
    {
      id: OTHER_MAGIC_LINK_ID,
      identifier: 'magic-link:other-magic-link-token',
      value: JSON.stringify({ email: 'ada@example.com' }),
      expiresAt
    },
    {
      id: EMAIL_VERIFICATION_ID,
      identifier: VerificationConstants.MagicLinkToken,
      value: 'ada@example.com',
      expiresAt
    }
  ];
}
