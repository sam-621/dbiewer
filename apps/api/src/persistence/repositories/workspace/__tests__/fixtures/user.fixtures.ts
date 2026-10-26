import type { Fixture } from '@tests/utils/fixture';

import { user } from '@/persistence/schema';

const OWNER_USER_ID = crypto.randomUUID();
const OTHER_OWNER_USER_ID = crypto.randomUUID();
const USER_WITHOUT_WORKSPACE_ID = crypto.randomUUID();

export const UserConstants = {
  OwnerUserId: OWNER_USER_ID,
  OtherOwnerUserId: OTHER_OWNER_USER_ID,
  UserWithoutWorkspaceId: USER_WITHOUT_WORKSPACE_ID
};

export class UserFixtures implements Fixture<typeof user> {
  table = user;

  rows: (typeof user)['$inferInsert'][] = [
    { id: OWNER_USER_ID, name: 'Ada', email: 'ada@example.com', emailVerified: true },
    { id: OTHER_OWNER_USER_ID, name: 'Grace', email: 'grace@example.com', emailVerified: true },
    { id: USER_WITHOUT_WORKSPACE_ID, name: '', email: 'alan@example.com', emailVerified: true }
  ];
}
