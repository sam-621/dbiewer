import type { Fixture } from '@tests/utils/fixture';

import { file } from '@/persistence/schema';

import { ConnectionConstants } from './connection.fixtures';
import { WorkspaceConstants } from './workspace.fixtures';

const MONTHLY_REPORT_FILE_ID = crypto.randomUUID();
const ACTIVE_USERS_FILE_ID = crypto.randomUUID();
const OTHER_WORKSPACE_FILE_ID = crypto.randomUUID();

export const FileConstants = {
  MonthlyReportFileId: MONTHLY_REPORT_FILE_ID,
  ActiveUsersFileId: ACTIVE_USERS_FILE_ID,
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
      content: 'select 1'
    },
    {
      id: ACTIVE_USERS_FILE_ID,
      tenantId: WorkspaceConstants.OwnerWorkspaceId,
      connectionId: ConnectionConstants.ProductionConnectionId,
      name: 'Active users',
      type: 'sql',
      content: 'select 2'
    },
    {
      id: OTHER_WORKSPACE_FILE_ID,
      tenantId: WorkspaceConstants.OtherOwnerWorkspaceId,
      connectionId: ConnectionConstants.OtherWorkspaceConnectionId,
      name: 'Warehouse load',
      type: 'sql',
      content: 'select 3'
    }
  ];
}
