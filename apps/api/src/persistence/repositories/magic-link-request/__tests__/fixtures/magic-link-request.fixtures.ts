import type { Fixture } from '@tests/utils/fixture';

import { magicLinkRequest } from '@/persistence/schema';

const RECENT_REQUEST_ID = crypto.randomUUID();
const RECENT_UPPERCASE_REQUEST_ID = crypto.randomUUID();
const OLD_REQUEST_ID = crypto.randomUUID();
const OTHER_EMAIL_REQUEST_ID = crypto.randomUUID();

export const MagicLinkRequestConstants = {
  RecentRequestId: RECENT_REQUEST_ID,
  RecentUppercaseRequestId: RECENT_UPPERCASE_REQUEST_ID,
  OldRequestId: OLD_REQUEST_ID,
  OtherEmailRequestId: OTHER_EMAIL_REQUEST_ID,
  Email: 'ada@example.com',
  OtherEmail: 'grace@example.com',
  NewEmail: 'alan@example.com',
  Since: new Date('2026-10-25T11:50:00Z')
};

export class MagicLinkRequestFixtures implements Fixture<typeof magicLinkRequest> {
  table = magicLinkRequest;

  rows: (typeof magicLinkRequest)['$inferInsert'][] = [
    {
      id: MagicLinkRequestConstants.RecentRequestId,
      email: MagicLinkRequestConstants.Email,
      createdAt: new Date('2026-10-25T11:55:00Z')
    },
    {
      id: MagicLinkRequestConstants.RecentUppercaseRequestId,
      email: 'Ada@Example.com',
      createdAt: new Date('2026-10-25T11:50:00Z')
    },
    {
      id: MagicLinkRequestConstants.OldRequestId,
      email: MagicLinkRequestConstants.Email,
      createdAt: new Date('2026-10-25T11:49:59Z')
    },
    {
      id: MagicLinkRequestConstants.OtherEmailRequestId,
      email: MagicLinkRequestConstants.OtherEmail,
      createdAt: new Date('2026-10-25T11:55:00Z')
    }
  ];
}
