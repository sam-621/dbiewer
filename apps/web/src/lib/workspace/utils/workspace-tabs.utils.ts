import { z } from 'zod';

import {
  DEFAULT_TABLE_VIEW_STATE,
  type TableViewState,
  TableViewStateSchema
} from '@/lib/database-schema/utils/table-view.utils';

import { DIAGRAM_TAB_KEY } from '../constants/workspace-tabs';

const ObjectTabSchema = z.object({
  key: z.string(),
  kind: z.enum(['table', 'view']),
  schema: z.string(),
  name: z.string(),
  state: TableViewStateSchema
});

const FunctionTabSchema = z.object({
  key: z.string(),
  kind: z.literal('function'),
  schema: z.string(),
  name: z.string(),
  arguments: z.string()
});

const FileExtensionSchema = z.enum(['sql', 'txt']);

const DraftTabSchema = z.object({
  key: z.string(),
  kind: z.literal('draft'),
  number: z.number().int().min(1),
  type: FileExtensionSchema.default('sql'),
  isDirty: z.boolean().default(false)
});

const FileTabSchema = z.object({
  key: z.string(),
  kind: z.literal('file'),
  fileId: z.string(),
  name: z.string(),
  type: FileExtensionSchema,
  isDirty: z.boolean().default(false),
  draftKey: z.string().optional()
});

const DiagramTabSchema = z.object({
  key: z.string(),
  kind: z.literal('diagram')
});

const WorkspaceTabSchema = z.discriminatedUnion('kind', [
  ObjectTabSchema,
  FunctionTabSchema,
  DraftTabSchema,
  FileTabSchema,
  DiagramTabSchema
]);

export const WorkspaceTabsSchema = z.object({
  tabs: z.array(WorkspaceTabSchema),
  activeKey: z.string().nullable(),
  provisionalKey: z.string().nullable()
});

export type WorkspaceTab = z.infer<typeof WorkspaceTabSchema>;
export type WorkspaceTabs = z.infer<typeof WorkspaceTabsSchema>;
export type ObjectTab = z.infer<typeof ObjectTabSchema>;
export type FunctionTab = z.infer<typeof FunctionTabSchema>;
export type DraftTab = z.infer<typeof DraftTabSchema>;
export type FileTab = z.infer<typeof FileTabSchema>;
export type FileExtension = z.infer<typeof FileExtensionSchema>;
export type WorkspaceTabObject =
  Pick<ObjectTab, 'kind' | 'schema' | 'name'> | Omit<FunctionTab, 'key'>;

export const EMPTY_WORKSPACE_TABS: WorkspaceTabs = {
  tabs: [],
  activeKey: null,
  provisionalKey: null
};

export const getTabKey = (object: WorkspaceTabObject) =>
  object.kind === 'function'
    ? `function:${object.schema}.${object.name}(${object.arguments})`
    : `${object.kind}:${object.schema}.${object.name}`;

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

  const tab: WorkspaceTab =
    object.kind === 'function'
      ? { key, ...object }
      : { key, ...object, state: DEFAULT_TABLE_VIEW_STATE };

  if (isPinned) return { ...current, tabs: [...current.tabs, tab], activeKey: key };

  const hasProvisional = current.tabs.some(existing => existing.key === current.provisionalKey);
  const tabs = hasProvisional
    ? current.tabs.map(existing => (existing.key === current.provisionalKey ? tab : existing))
    : [...current.tabs, tab];

  return { tabs, activeKey: key, provisionalKey: key };
};

export const getDraftTabKey = (id: string) => `draft:${id}`;

export const getFileTabKey = (id: string) => `file:${id}`;

export const hasStoredDraft = (key: string) => key.startsWith('draft:') || key.startsWith('file:');

export const openDraftTab = (
  current: WorkspaceTabs,
  id: string,
  type: FileExtension
): WorkspaceTabs => {
  const key = getDraftTabKey(id);
  const numbers = current.tabs.map(tab => (tab.kind === 'draft' ? tab.number : 0));
  const tab: DraftTab = {
    key,
    kind: 'draft',
    number: Math.max(0, ...numbers) + 1,
    type,
    isDirty: false
  };

  return { ...current, tabs: [...current.tabs, tab], activeKey: key };
};

export const openFileTab = (
  current: WorkspaceTabs,
  file: { id: string; name: string; type: FileExtension }
): WorkspaceTabs => {
  const key = getFileTabKey(file.id);

  if (current.tabs.some(tab => tab.key === key)) return { ...current, activeKey: key };

  const tab: FileTab = {
    key,
    kind: 'file',
    fileId: file.id,
    name: file.name,
    type: file.type,
    isDirty: false
  };

  return { ...current, tabs: [...current.tabs, tab], activeKey: key };
};

export const openDiagramTab = (current: WorkspaceTabs): WorkspaceTabs => {
  if (current.tabs.some(tab => tab.key === DIAGRAM_TAB_KEY)) {
    return { ...current, activeKey: DIAGRAM_TAB_KEY };
  }

  return {
    ...current,
    tabs: [...current.tabs, { key: DIAGRAM_TAB_KEY, kind: 'diagram' }],
    activeKey: DIAGRAM_TAB_KEY
  };
};

export const replaceDraftTab = (
  current: WorkspaceTabs,
  draftKey: string,
  file: { id: string; name: string }
): WorkspaceTabs => {
  const key = getFileTabKey(file.id);

  return {
    ...current,
    tabs: current.tabs.map(tab =>
      tab.key === draftKey && tab.kind === 'draft'
        ? {
            key,
            kind: 'file',
            fileId: file.id,
            name: file.name,
            type: tab.type,
            isDirty: false,
            draftKey
          }
        : tab
    ),
    activeKey: current.activeKey === draftKey ? key : current.activeKey
  };
};

export const renameFileTab = (
  current: WorkspaceTabs,
  key: string,
  name: string
): WorkspaceTabs => ({
  ...current,
  tabs: current.tabs.map(tab => (tab.key === key && tab.kind === 'file' ? { ...tab, name } : tab))
});

export const changeTabDirty = (
  current: WorkspaceTabs,
  key: string,
  isDirty: boolean
): WorkspaceTabs => {
  const target = current.tabs.find(tab => tab.key === key);
  if (!target || !('isDirty' in target) || target.isDirty === isDirty) return current;

  return {
    ...current,
    tabs: current.tabs.map(tab => (tab.key === key && 'isDirty' in tab ? { ...tab, isDirty } : tab))
  };
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

export const getRemovedTabKeys = (current: WorkspaceTabs, next: WorkspaceTabs) =>
  current.tabs
    .filter(tab => !next.tabs.some(nextTab => nextTab.key === tab.key))
    .map(tab => tab.key);

export const changeTabState = (
  current: WorkspaceTabs,
  key: string,
  state: TableViewState
): WorkspaceTabs =>
  pinTab(
    {
      ...current,
      tabs: current.tabs.map(tab => (tab.key === key && 'state' in tab ? { ...tab, state } : tab))
    },
    key
  );
