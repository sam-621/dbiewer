import type { Fixture } from '@tests/utils/fixture';

import { workspace } from '@/persistence/schema';

import { UserConstants } from './user.fixtures';

const OWNER_WORKSPACE_ID = crypto.randomUUID();
const OTHER_OWNER_WORKSPACE_ID = crypto.randomUUID();

export const WorkspaceConstants = {
  OwnerWorkspaceId: OWNER_WORKSPACE_ID,
  OtherOwnerWorkspaceId: OTHER_OWNER_WORKSPACE_ID
};

export class WorkspaceFixtures implements Fixture<typeof workspace> {
  table = workspace;

  rows: (typeof workspace)['$inferInsert'][] = [
    {
      id: OWNER_WORKSPACE_ID,
      ownerUserId: UserConstants.OwnerUserId,
      name: "Ada's workspace",
      slug: 'adas-workspace-a1b2c3'
    },
    {
      id: OTHER_OWNER_WORKSPACE_ID,
      ownerUserId: UserConstants.OtherOwnerUserId,
      name: "Grace's workspace",
      slug: 'graces-workspace-b2c3d4'
    }
  ];
}
