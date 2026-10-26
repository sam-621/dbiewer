import type { Fixture } from '@tests/utils/fixture';

import { user } from '@/persistence/schema';

const USER_ID = crypto.randomUUID();
const OTHER_USER_ID = crypto.randomUUID();

export const UserConstants = {
  UserId: USER_ID,
  UserEmail: 'ada@example.com',
  OtherUserId: OTHER_USER_ID
};

export class UserFixtures implements Fixture<typeof user> {
  table = user;

  rows: (typeof user)['$inferInsert'][] = [
    {
      id: USER_ID,
      name: 'Ada',
      email: UserConstants.UserEmail,
      emailVerified: true,
      image: 'https://example.com/ada.png'
    },
    { id: OTHER_USER_ID, name: 'Grace', email: 'grace@example.com', emailVerified: true }
  ];
}
