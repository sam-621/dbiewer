import type { Fixture } from '@tests/utils/fixture';

import { user } from '@/persistence/schema';

const USER_WITHOUT_WORKSPACE_ID = crypto.randomUUID();
const OWNER_USER_ID = crypto.randomUUID();
const OTHER_OWNER_USER_ID = crypto.randomUUID();

export const UserConstants = {
  UserWithoutWorkspaceId: USER_WITHOUT_WORKSPACE_ID,
  UserWithoutWorkspaceEmail: 'alan@example.com',
  OwnerUserId: OWNER_USER_ID,
  OwnerEmail: 'ada@example.com',
  OtherOwnerUserId: OTHER_OWNER_USER_ID
};

export class UserFixtures implements Fixture<typeof user> {
  table = user;

  rows: (typeof user)['$inferInsert'][] = [
    {
      id: USER_WITHOUT_WORKSPACE_ID,
      name: 'Alan',
      email: UserConstants.UserWithoutWorkspaceEmail,
      emailVerified: true
    },
    { id: OWNER_USER_ID, name: 'Ada', email: UserConstants.OwnerEmail, emailVerified: true },
    { id: OTHER_OWNER_USER_ID, name: 'Grace', email: 'grace@example.com', emailVerified: true }
  ];
}
