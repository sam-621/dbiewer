import type { Fixture } from '@tests/utils/fixture';

import { connection } from '@/persistence/schema';

import { WorkspaceConstants } from './workspace.fixtures';

const PRODUCTION_CONNECTION_ID = crypto.randomUUID();
const OTHER_WORKSPACE_CONNECTION_ID = crypto.randomUUID();

export const ConnectionConstants = {
  ProductionConnectionId: PRODUCTION_CONNECTION_ID,
  OtherWorkspaceConnectionId: OTHER_WORKSPACE_CONNECTION_ID
};

export class ConnectionFixtures implements Fixture<typeof connection> {
  table = connection;

  rows: (typeof connection)['$inferInsert'][] = [
    {
      id: PRODUCTION_CONNECTION_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      name: 'Production',
      host: 'db.example.com',
      port: 5432,
      database: 'app',
      username: 'ada',
      passwordEncrypted: 'v1:iv:tag:ciphertext',
      sslMode: 'verify-full'
    },
    {
      id: OTHER_WORKSPACE_CONNECTION_ID,
      tenantId: WorkspaceConstants.OtherOwnerWorkspaceId,
      name: 'Analytics',
      host: 'analytics.example.com',
      port: 5432,
      database: 'warehouse',
      username: 'grace',
      passwordEncrypted: null,
      sslMode: 'require'
    }
  ];
}
