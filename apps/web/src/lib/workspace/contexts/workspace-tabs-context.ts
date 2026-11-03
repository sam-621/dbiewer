import { createContext } from 'react';

import type { OpenExplorerObject } from '@/lib/database-schema/components/explorer/explorer-object';
import type { TableViewState } from '@/lib/database-schema/utils/table-view.utils';

import type { WorkspaceTabs } from '../utils/workspace-tabs.utils';

type WorkspaceTabsContextValue = WorkspaceTabs & {
  openObject: OpenExplorerObject;
  openDraft: () => void;
  activateTab: (key: string) => void;
  pinTab: (key: string) => void;
  closeTab: (key: string) => void;
  changeTabState: (key: string, state: TableViewState) => void;
};

export const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null);
