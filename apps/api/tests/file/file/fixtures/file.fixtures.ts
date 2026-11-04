import type { Fixture } from '@tests/utils/fixture';

import { file } from '@/persistence/schema';

import { ConnectionConstants } from './connection.fixtures';
import { WorkspaceConstants } from './workspace.fixtures';

const RELEASE_NOTES_FILE_ID = crypto.randomUUID();
const OTHER_WORKSPACE_FILE_ID = crypto.randomUUID();

export const FileConstants = {
  ReleaseNotesFileId: RELEASE_NOTES_FILE_ID,
  OtherWorkspaceFileId: OTHER_WORKSPACE_FILE_ID
};

export class FileFixtures implements Fixture<typeof file> {
  table = file;

  rows: (typeof file)['$inferInsert'][] = [
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
      id: OTHER_WORKSPACE_FILE_ID,
      tenantId: WorkspaceConstants.OtherOwnerWorkspaceId,
      connectionId: ConnectionConstants.OtherWorkspaceConnectionId,
      name: 'Warehouse load',
      type: 'sql',
      content: 'select 1',
      updatedAt: new Date('2026-02-02T00:00:00Z')
    }
  ];
}
