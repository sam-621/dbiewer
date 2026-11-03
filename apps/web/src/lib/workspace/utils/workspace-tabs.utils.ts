import { z } from 'zod';

import {
  DEFAULT_TABLE_VIEW_STATE,
  type TableViewState,
  TableViewStateSchema
} from '@/lib/database-schema/utils/table-view.utils';

const WorkspaceTabSchema = z.object({
  key: z.string(),
  kind: z.enum(['table', 'view']),
  schema: z.string(),
  name: z.string(),
  state: TableViewStateSchema
});

export const WorkspaceTabsSchema = z.object({
  tabs: z.array(WorkspaceTabSchema),
  activeKey: z.string().nullable(),
  provisionalKey: z.string().nullable()
});

export type WorkspaceTab = z.infer<typeof WorkspaceTabSchema>;
export type WorkspaceTabs = z.infer<typeof WorkspaceTabsSchema>;
export type WorkspaceTabObject = Pick<WorkspaceTab, 'kind' | 'schema' | 'name'>;

export const EMPTY_WORKSPACE_TABS: WorkspaceTabs = {
  tabs: [],
  activeKey: null,
  provisionalKey: null
};

export const getTabKey = ({ kind, schema, name }: WorkspaceTabObject) =>
  `${kind}:${schema}.${name}`;

export const openTab = (
  current: WorkspaceTabs,
  object: WorkspaceTabObject,
  { isPinned }: { isPinned: boolean }
): WorkspaceTabs => {
  const key = getTabKey(object);

  if (current.tabs.some(tab => tab.key === key)) {
    const provisionalKey =
      isPinned && current.provisionalKey === key ? null : current.provisionalKey;
    return { ...current, activeKey: key, provisionalKey };
  }

  const tab: WorkspaceTab = { key, ...object, state: DEFAULT_TABLE_VIEW_STATE };

  if (isPinned) return { ...current, tabs: [...current.tabs, tab], activeKey: key };

  const hasProvisional = current.tabs.some(existing => existing.key === current.provisionalKey);
  const tabs = hasProvisional
    ? current.tabs.map(existing => (existing.key === current.provisionalKey ? tab : existing))
    : [...current.tabs, tab];

  return { tabs, activeKey: key, provisionalKey: key };
};

export const activateTab = (current: WorkspaceTabs, key: string): WorkspaceTabs => ({
  ...current,
  activeKey: key
});

export const pinTab = (current: WorkspaceTabs, key: string): WorkspaceTabs => ({
  ...current,
  provisionalKey: current.provisionalKey === key ? null : current.provisionalKey
});

export const closeTab = (current: WorkspaceTabs, key: string): WorkspaceTabs => {
  const index = current.tabs.findIndex(tab => tab.key === key);
  if (index === -1) return current;

  const tabs = current.tabs.filter(tab => tab.key !== key);
  const neighbor = tabs[index] ?? tabs[index - 1] ?? null;

  return {
    tabs,
    activeKey: current.activeKey === key ? (neighbor?.key ?? null) : current.activeKey,
    provisionalKey: current.provisionalKey === key ? null : current.provisionalKey
  };
};

export const changeTabState = (
  current: WorkspaceTabs,
  key: string,
  state: TableViewState
): WorkspaceTabs =>
  pinTab(
    { ...current, tabs: current.tabs.map(tab => (tab.key === key ? { ...tab, state } : tab)) },
    key
  );
