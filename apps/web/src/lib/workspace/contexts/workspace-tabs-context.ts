import { createContext } from 'react';

import type { OpenExplorerObject } from '@/lib/database-schema/components/explorer/explorer-object';
import type { DiagramNavigation } from '@/lib/database-schema/constants/diagram-navigation';
import type { TableChanges } from '@/lib/database-schema/utils/table-changes.utils';
import type { TableViewState } from '@/lib/database-schema/utils/table-view.utils';

import type { FileExtension, WorkspaceTabs } from '../utils/workspace-tabs.utils';

type WorkspaceTabsContextValue = WorkspaceTabs & {
  openObject: OpenExplorerObject;
  openDraft: (type: FileExtension) => void;
  openFile: (file: { id: string; name: string; type: FileExtension }) => void;
  openDiagram: () => void;
  replaceDraftTab: (key: string, file: { id: string; name: string }) => void;
  renameFileTab: (key: string, name: string) => void;
  changeTabDirty: (key: string, isDirty: boolean) => void;
  activateTab: (key: string) => void;
  pinTab: (key: string) => void;
  closeTab: (key: string) => void;
  changeTabState: (key: string, state: TableViewState) => void;
  getHiddenColumns: (key: string) => string[];
  changeHiddenColumns: (key: string, hiddenColumns: string[]) => void;
  getTableChanges: (key: string) => TableChanges;
  changeTableChanges: (key: string, changes: TableChanges) => void;
  getDiagramNavigation: (key: string) => DiagramNavigation;
  changeDiagramNavigation: (key: string, change: Partial<DiagramNavigation>) => void;
};

export const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null);
