import { type ReactNode, useRef, useState } from 'react';

import type { OpenExplorerObject } from '@/lib/database-schema/components/explorer/explorer-object';
import {
  DEFAULT_DIAGRAM_NAVIGATION,
  type DiagramNavigation
} from '@/lib/database-schema/constants/diagram-navigation';
import {
  EMPTY_TABLE_CHANGES,
  type TableChanges
} from '@/lib/database-schema/utils/table-changes.utils';
import type { TableViewState } from '@/lib/database-schema/utils/table-view.utils';
import { removeStoredDraft } from '@/lib/file/hooks/use-file-draft';
import { Logger } from '@/shared/utils/logger';

import {
  activateTab,
  changeTabDirty,
  changeTabState,
  closeTab,
  EMPTY_WORKSPACE_TABS,
  getRemovedTabKeys,
  hasStoredDraft,
  openDiagramTab,
  openDraftTab,
  openFileTab,
  openTab,
  pinTab,
  renameFileTab,
  replaceDraftTab,
  type WorkspaceTabs,
  WorkspaceTabsSchema
} from '../utils/workspace-tabs.utils';

import { WorkspaceTabsContext } from './workspace-tabs-context';

type Props = { connectionId: string; children: ReactNode };

type HiddenColumns = Record<string, string[]>;

type DiagramNavigations = Record<string, DiagramNavigation>;

type TablesChanges = Record<string, TableChanges>;

export const WorkspaceTabsProvider = ({ connectionId, children }: Props) => {
  const [stored, setStored] = useState(() => ({
    connectionId,
    workspaceTabs: getStoredTabs(connectionId)
  }));

  if (stored.connectionId !== connectionId) {
    setStored({ connectionId, workspaceTabs: getStoredTabs(connectionId) });
  }

  const [hiddenColumns, setHiddenColumns] = useState<HiddenColumns>({});
  const [tablesChanges, setTablesChanges] = useState<TablesChanges>({});
  const diagramNavigations = useRef<DiagramNavigations>({});

  const { workspaceTabs } = stored;

  const update = (next: WorkspaceTabs) => {
    setStored({ connectionId, workspaceTabs: next });
    storeTabs(connectionId, next);

    const removedKeys = getRemovedTabKeys(workspaceTabs, next);
    if (removedKeys.length) {
      setHiddenColumns(current => removeTabEntries(current, connectionId, removedKeys));
      setTablesChanges(current => removeTabEntries(current, connectionId, removedKeys));
      diagramNavigations.current = removeTabEntries(
        diagramNavigations.current,
        connectionId,
        removedKeys
      );
    }
  };

  const openObject: OpenExplorerObject = (object, options) =>
    update(openTab(workspaceTabs, object, options));

  const closeWorkspaceTab = (key: string) => {
    update(closeTab(workspaceTabs, key));
    if (hasStoredDraft(key)) removeStoredDraft(connectionId, key);
  };

  return (
    <WorkspaceTabsContext
      value={{
        ...workspaceTabs,
        openObject,
        openDraft: type => update(openDraftTab(workspaceTabs, crypto.randomUUID(), type)),
        openFile: file => update(openFileTab(workspaceTabs, file)),
        openDiagram: () => update(openDiagramTab(workspaceTabs)),
        replaceDraftTab: (key, file) => update(replaceDraftTab(workspaceTabs, key, file)),
        renameFileTab: (key, name) => update(renameFileTab(workspaceTabs, key, name)),
        changeTabDirty: (key, isDirty) => {
          const next = changeTabDirty(workspaceTabs, key, isDirty);
          if (next !== workspaceTabs) update(next);
        },
        activateTab: key => update(activateTab(workspaceTabs, key)),
        pinTab: key => update(pinTab(workspaceTabs, key)),
        closeTab: closeWorkspaceTab,
        changeTabState: (key: string, state: TableViewState) =>
          update(changeTabState(workspaceTabs, key, state)),
        getHiddenColumns: key => hiddenColumns[getTabEntryKey(connectionId, key)] ?? [],
        changeHiddenColumns: (key, columns) => {
          setHiddenColumns(current => ({
            ...current,
            [getTabEntryKey(connectionId, key)]: columns
          }));
          update(pinTab(workspaceTabs, key));
        },
        getTableChanges: key =>
          tablesChanges[getTabEntryKey(connectionId, key)] ?? EMPTY_TABLE_CHANGES,
        changeTableChanges: (key, changes) => {
          setTablesChanges(current => ({
            ...current,
            [getTabEntryKey(connectionId, key)]: changes
          }));
          update(pinTab(workspaceTabs, key));
        },
        getDiagramNavigation: key =>
          diagramNavigations.current[getTabEntryKey(connectionId, key)] ??
          DEFAULT_DIAGRAM_NAVIGATION,
        changeDiagramNavigation: (key, change) => {
          const entryKey = getTabEntryKey(connectionId, key);

          const current = diagramNavigations.current[entryKey] ?? DEFAULT_DIAGRAM_NAVIGATION;

          diagramNavigations.current = {
            ...diagramNavigations.current,
            [entryKey]: { ...current, ...change }
          };
        }
      }}
    >
      {children}
    </WorkspaceTabsContext>
  );
};

const getTabEntryKey = (connectionId: string, key: string) => `${connectionId}:${key}`;

const removeTabEntries = <T,>(current: Record<string, T>, connectionId: string, keys: string[]) => {
  const removed = keys.map(key => getTabEntryKey(connectionId, key));

  return Object.fromEntries(Object.entries(current).filter(([key]) => !removed.includes(key)));
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
