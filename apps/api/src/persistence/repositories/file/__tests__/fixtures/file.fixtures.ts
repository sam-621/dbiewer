import type { Fixture } from '@tests/utils/fixture';

import { file } from '@/persistence/schema';

import { ConnectionConstants } from './connection.fixtures';
import { WorkspaceConstants } from './workspace.fixtures';

const MONTHLY_REPORT_FILE_ID = '00000000-0000-4000-8000-000000000001';
const ACTIVE_USERS_FILE_ID = '00000000-0000-4000-8000-000000000002';
const RELEASE_NOTES_FILE_ID = crypto.randomUUID();
const LATEST_ORDERS_FILE_ID = crypto.randomUUID();
const STAGING_FILE_ID = crypto.randomUUID();
const OTHER_WORKSPACE_FILE_ID = crypto.randomUUID();

export const FileConstants = {
  MonthlyReportFileId: MONTHLY_REPORT_FILE_ID,
  ActiveUsersFileId: ACTIVE_USERS_FILE_ID,
  ReleaseNotesFileId: RELEASE_NOTES_FILE_ID,
  LatestOrdersFileId: LATEST_ORDERS_FILE_ID,
  StagingFileId: STAGING_FILE_ID,
  OtherWorkspaceFileId: OTHER_WORKSPACE_FILE_ID
};

export class FileFixtures implements Fixture<typeof file> {
  table = file;

  rows: (typeof file)['$inferInsert'][] = [
    {
      id: MONTHLY_REPORT_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Monthly report',
      type: 'sql',
      content: 'select 1',
      updatedAt: new Date('2026-02-02T00:00:00Z')
    },
    {
      id: ACTIVE_USERS_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Active users',
      type: 'sql',
      content: 'select 2',
      updatedAt: new Date('2026-02-02T00:00:00Z')
    },
    {
      id: RELEASE_NOTES_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Release notes',
      type: 'txt',
      content: 'Notes',
      updatedAt: new Date('2026-02-01T00:00:00Z')
    },
    {
      id: LATEST_ORDERS_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Latest orders',
      type: 'sql',
      content: 'select 3',
      updatedAt: new Date('2026-02-03T00:00:00Z')
    },
    {
      id: STAGING_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.StagingConnectionId,
      name: 'Staging checks',
      type: 'sql',
      content: 'select 4',
      updatedAt: new Date('2026-02-04T00:00:00Z')
    },
    {
      id: OTHER_WORKSPACE_FILE_ID,
      tenantId: WorkspaceConstants.OtherOwnerWorkspaceId,
      connectionId: ConnectionConstants.OtherWorkspaceConnectionId,
      name: 'Warehouse load',
      type: 'sql',
      content: 'select 5',
      updatedAt: new Date('2026-02-05T00:00:00Z')
    }
  ];
}
