import type { DbCellValueInput, SaveTableChangesInput } from '@/lib/api/types';

import { getTableRowKeyId, type TableRowKey } from './table-view.utils';

export type TableCellValues = Record<string, string | null>;

export type TableRowEdit = { key: TableRowKey; values: TableCellValues };

export type TableNewRow = { id: string; values: TableCellValues };

export type TableChanges = {
  edits: Record<string, TableRowEdit>;
  newRows: TableNewRow[];
};

export const EMPTY_TABLE_CHANGES: TableChanges = { edits: {}, newRows: [] };

export const countTableChanges = ({ edits, newRows }: TableChanges) =>
  Object.values(edits).reduce((count, edit) => count + Object.keys(edit.values).length, 0) +
  newRows.length;

export const editTableCell = (
  changes: TableChanges,
  {
    key,
    column,
    value,
    original
  }: {
    key: TableRowKey;
    column: string;
    value: string | null;
    original: string | null;
  }
): TableChanges => {
  const id = getTableRowKeyId(key);
  const { [column]: _previous, ...rest } = changes.edits[id]?.values ?? {};
  const values = value === original ? rest : { ...rest, [column]: value };
  const { [id]: _edit, ...edits } = changes.edits;

  return {
    ...changes,
    edits: Object.keys(values).length ? { ...edits, [id]: { key, values } } : edits
  };
};

export const addTableNewRow = (changes: TableChanges, id: string): TableChanges => ({
  ...changes,
  newRows: [...changes.newRows, { id, values: {} }]
});

export const editTableNewRowCell = (
  changes: TableChanges,
  { id, column, value }: { id: string; column: string; value: string | null }
): TableChanges => ({
  ...changes,
  newRows: changes.newRows.map(row => {
    if (row.id !== id) return row;

    const { [column]: _previous, ...values } = row.values;
    return { ...row, values: value === '' ? values : { ...values, [column]: value } };
  })
});

export const removeTableNewRows = (changes: TableChanges, ids: string[]): TableChanges => ({
  ...changes,
  newRows: changes.newRows.filter(row => !ids.includes(row.id))
});

export const removeTableRowEdits = (changes: TableChanges, keys: TableRowKey[]): TableChanges => {
  const ids = keys.map(getTableRowKeyId);

  return {
    ...changes,
    edits: Object.fromEntries(Object.entries(changes.edits).filter(([id]) => !ids.includes(id)))
  };
};

const toCellValues = (values: TableCellValues): DbCellValueInput[] =>
  Object.entries(values).map(([column, value]) => ({ column, value }));

export const getSaveTableChanges = ({
  edits,
  newRows
}: TableChanges): Pick<SaveTableChangesInput, 'updates' | 'inserts'> => ({
  updates: Object.values(edits).map(({ key, values }) => ({ key, values: toCellValues(values) })),
  inserts: newRows.map(({ values }) => ({ values: toCellValues(values) }))
});
