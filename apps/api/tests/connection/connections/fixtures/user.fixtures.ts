import type { Fixture } from '@tests/utils/fixture';

import { user } from '@/persistence/schema';

const OWNER_USER_ID = crypto.randomUUID();
const OTHER_OWNER_USER_ID = crypto.randomUUID();
const EMPTY_OWNER_USER_ID = crypto.randomUUID();

export const UserConstants = {
  OwnerUserId: OWNER_USER_ID,
  OwnerEmail: 'ada@example.com',
  OtherOwnerUserId: OTHER_OWNER_USER_ID,
  OtherOwnerEmail: 'grace@example.com',
  EmptyOwnerUserId: EMPTY_OWNER_USER_ID,
  EmptyOwnerEmail: 'alan@example.com'
};

export class UserFixtures implements Fixture<typeof user> {
  table = user;

  rows: (typeof user)['$inferInsert'][] = [
    { id: OWNER_USER_ID, name: 'Ada', email: UserConstants.OwnerEmail, emailVerified: true },
    {
      id: OTHER_OWNER_USER_ID,
      name: 'Grace',
      email: UserConstants.OtherOwnerEmail,
      emailVerified: true
    },
    {
      id: EMPTY_OWNER_USER_ID,
      name: 'Alan',
      email: UserConstants.EmptyOwnerEmail,
      emailVerified: true
    }
  ];
}
