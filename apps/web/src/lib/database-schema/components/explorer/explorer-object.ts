export type ExplorerObject =
  | { kind: 'table' | 'view'; schema: string; name: string }
  | { kind: 'function'; schema: string; name: string; arguments: string };

export type OpenExplorerObject = (object: ExplorerObject, options: { isPinned: boolean }) => void;

export type ChangeExplorerExpanded = (id: string, isExpanded: boolean) => void;
