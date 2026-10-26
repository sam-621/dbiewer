import type { Fixture } from '@tests/utils/fixture';

import { connection } from '@/persistence/schema';

import { WorkspaceConstants } from './workspace.fixtures';

const PRODUCTION_CONNECTION_ID = '00000000-0000-4000-8000-000000000001';
const STAGING_CONNECTION_ID = '00000000-0000-4000-8000-000000000002';
const LOCAL_CONNECTION_ID = crypto.randomUUID();
const OTHER_WORKSPACE_CONNECTION_ID = crypto.randomUUID();

export const ConnectionConstants = {
  ProductionConnectionId: PRODUCTION_CONNECTION_ID,
  StagingConnectionId: STAGING_CONNECTION_ID,
  LocalConnectionId: LOCAL_CONNECTION_ID,
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
      sslMode: 'verify-full',
      createdAt: new Date('2026-01-02T00:00:00Z')
    },
    {
      id: STAGING_CONNECTION_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      name: 'Staging',
      host: 'staging.example.com',
      port: 5432,
      database: 'app',
      username: 'ada',
      passwordEncrypted: null,
      sslMode: 'require',
      createdAt: new Date('2026-01-02T00:00:00Z')
    },
    {
      id: LOCAL_CONNECTION_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      name: 'Local',
      host: 'localhost',
      port: 5433,
      database: 'app_dev',
      username: 'postgres',
      passwordEncrypted: null,
      sslMode: 'disable',
      createdAt: new Date('2026-01-01T00:00:00Z')
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
      sslMode: 'require',
      createdAt: new Date('2026-01-03T00:00:00Z')
    }
  ];
}
