import { z } from 'zod';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getShellError } from '@/lib/api/errors/shell.errors';
import type {
  DbCellValueInput,
  GetTableRowsQuery,
  GetTableStructureQuery,
  ShellErrorCode
} from '@/lib/api/types';
import { quoteIdentifier } from '@/lib/query/utils/sql.utils';

export type TableStructureNode = NonNullable<GetTableStructureQuery['tableStructure']['structure']>;
export type TableColumnNode = TableStructureNode['columns'][number];
export type TableRowsNode = NonNullable<GetTableRowsQuery['tableRows']['tableRows']>;

export const TABLE_PAGE_SIZE = 50;

export const TableViewStateSchema = z.object({
  view: z.enum(['data', 'structure']),
  where: z.string().catch(''),
  orderBy: z.string().catch(''),
  page: z.number().int().min(1)
});

export type TableViewState = z.infer<typeof TableViewStateSchema>;
export type TableOrder = { column: string; direction: 'ASC' | 'DESC' };
export type TableRowKey = DbCellValueInput[];

export const DEFAULT_TABLE_VIEW_STATE: TableViewState = {
  view: 'data',
  where: '',
  orderBy: '',
  page: 1
};

const SINGLE_COLUMN_ORDER =
  /^\s*(?:"((?:[^"]|"")+)"|([\p{L}_][\p{L}\p{N}_$]*))(?:\s+(asc|desc))?\s*$/iu;

export const parseTableOrder = (orderBy: string): TableOrder | null => {
  const match = SINGLE_COLUMN_ORDER.exec(orderBy);
  if (!match) return null;

  const [, quoted, unquoted, direction] = match;

  return {
    column: quoted?.replaceAll('""', '"') ?? unquoted?.toLowerCase() ?? '',
    direction: direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
  };
};

export const formatTableOrder = ({ column, direction }: TableOrder) =>
  `${quoteIdentifier(column)} ${direction.toLowerCase()}`;

export const getVisibleTableRows = (
  { columns, rows }: Pick<TableRowsNode, 'columns' | 'rows'>,
  hiddenColumns: string[]
) => {
  const isVisible = columns.map(column => !hiddenColumns.includes(column.name));

  return {
    columns: columns.filter((_, index) => isVisible[index]),
    rows: rows.map(row => row.filter((_, index) => isVisible[index]))
  };
};

export const getPrimaryKeyColumns = (columns: Pick<TableColumnNode, 'name' | 'isPrimaryKey'>[]) =>
  columns.filter(column => column.isPrimaryKey).map(column => column.name);

export const getTableRowKey = (
  columns: TableRowsNode['columns'],
  row: (string | null)[],
  primaryKeys: string[]
): TableRowKey =>
  primaryKeys.map(column => ({
    column,
    value: row[columns.findIndex(({ name }) => name === column)] ?? null
  }));

export const getTableRowKeyId = (key: TableRowKey) => JSON.stringify(key);

export const getTotalPages = (totalRows: number) =>
  Math.max(1, Math.ceil(totalRows / TABLE_PAGE_SIZE));

export type TableQueryError = {
  error: string;
  errorCode?: ShellErrorCode;
  detail?: string;
};

export const getTableQueryError = (
  apiError: { code: ShellErrorCode; message: string } | undefined,
  isError: boolean
): TableQueryError | null => {
  if (apiError) return { ...getShellError(apiError.code), detail: apiError.message };
  return isError ? { error: GENERIC_ERROR } : null;
};
