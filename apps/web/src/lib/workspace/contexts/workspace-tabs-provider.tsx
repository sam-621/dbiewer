import { type ReactNode, useState } from 'react';

import type { OpenExplorerObject } from '@/lib/database-schema/components/explorer/explorer-object';
import type { TableViewState } from '@/lib/database-schema/utils/table-view.utils';
import { removeStoredDraftSql } from '@/lib/query/hooks/use-draft-sql';
import { Logger } from '@/shared/utils/logger';

import {
  activateTab,
  changeTabState,
  closeTab,
  EMPTY_WORKSPACE_TABS,
  isDraftTabKey,
  openDraftTab,
  openTab,
  pinTab,
  type WorkspaceTabs,
  WorkspaceTabsSchema
} from '../utils/workspace-tabs.utils';

import { WorkspaceTabsContext } from './workspace-tabs-context';

type Props = { connectionId: string; children: ReactNode };

export const WorkspaceTabsProvider = ({ connectionId, children }: Props) => {
  const [stored, setStored] = useState(() => ({
    connectionId,
    workspaceTabs: getStoredTabs(connectionId)
  }));

  if (stored.connectionId !== connectionId) {
    setStored({ connectionId, workspaceTabs: getStoredTabs(connectionId) });
  }

  const { workspaceTabs } = stored;

  const update = (next: WorkspaceTabs) => {
    setStored({ connectionId, workspaceTabs: next });
    storeTabs(connectionId, next);
  };

  const openObject: OpenExplorerObject = (object, options) =>
    update(openTab(workspaceTabs, object, options));

  const closeWorkspaceTab = (key: string) => {
    update(closeTab(workspaceTabs, key));
    if (isDraftTabKey(key)) removeStoredDraftSql(connectionId, key);
  };

  return (
    <WorkspaceTabsContext
      value={{
        ...workspaceTabs,
        openObject,
        openDraft: () => update(openDraftTab(workspaceTabs, crypto.randomUUID())),
        activateTab: key => update(activateTab(workspaceTabs, key)),
        pinTab: key => update(pinTab(workspaceTabs, key)),
        closeTab: closeWorkspaceTab,
        changeTabState: (key: string, state: TableViewState) =>
          update(changeTabState(workspaceTabs, key, state))
      }}
    >
      {children}
    </WorkspaceTabsContext>
  );
};

const getStorageKey = (connectionId: string) => `dbiewer:tabs:${connectionId}`;

const getStoredTabs = (connectionId: string): WorkspaceTabs => {
  try {
    const stored = localStorage.getItem(getStorageKey(connectionId));
    if (!stored) return EMPTY_WORKSPACE_TABS;

    const parsed = WorkspaceTabsSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : EMPTY_WORKSPACE_TABS;
  } catch (error) {
    Logger.error(error);
    return EMPTY_WORKSPACE_TABS;
  }
};

const storeTabs = (connectionId: string, workspaceTabs: WorkspaceTabs) => {
  try {
    localStorage.setItem(getStorageKey(connectionId), JSON.stringify(workspaceTabs));
  } catch (error) {
    Logger.error(error);
  }
};
