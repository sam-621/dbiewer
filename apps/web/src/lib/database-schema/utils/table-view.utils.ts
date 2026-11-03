import { z } from 'zod';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getShellError } from '@/lib/api/errors/shell.errors';
import type {
  DbFilterOperator,
  GetTableRowsQuery,
  GetTableStructureQuery,
  ShellErrorCode,
  SortDirection
} from '@/lib/api/types';

export type TableStructureNode = NonNullable<GetTableStructureQuery['tableStructure']['structure']>;
export type TableColumnNode = TableStructureNode['columns'][number];
export type TableRowsNode = NonNullable<GetTableRowsQuery['tableRows']['tableRows']>;

export const TABLE_PAGE_SIZE = 50;

export const TABLE_FILTER_OPERATORS = [
  'EQ',
  'NEQ',
  'GT',
  'GTE',
  'LT',
  'LTE',
  'CONTAINS',
  'IS_NULL',
  'IS_NOT_NULL'
] as const satisfies readonly DbFilterOperator[];

const SORT_DIRECTIONS = ['ASC', 'DESC'] as const satisfies readonly SortDirection[];

export const FILTER_OPERATOR_LABELS: Record<DbFilterOperator, string> = {
  EQ: '=',
  NEQ: '!=',
  GT: '>',
  GTE: '>=',
  LT: '<',
  LTE: '<=',
  CONTAINS: 'contains',
  IS_NULL: 'is null',
  IS_NOT_NULL: 'is not null'
};

export const TableViewStateSchema = z.object({
  view: z.enum(['data', 'structure']),
  filters: z.array(
    z.object({
      column: z.string(),
      operator: z.enum(TABLE_FILTER_OPERATORS),
      value: z.string().nullable()
    })
  ),
  orderBy: z.object({ column: z.string(), direction: z.enum(SORT_DIRECTIONS) }).nullable(),
  page: z.number().int().min(1)
});

export type TableViewState = z.infer<typeof TableViewStateSchema>;
export type TableFilter = TableViewState['filters'][number];
export type TableOrder = NonNullable<TableViewState['orderBy']>;

export const DEFAULT_TABLE_VIEW_STATE: TableViewState = {
  view: 'data',
  filters: [],
  orderBy: null,
  page: 1
};

export const isValuelessOperator = (operator: DbFilterOperator) =>
  operator === 'IS_NULL' || operator === 'IS_NOT_NULL';

export const formatFilterValue = (value: string) => `'${value.replaceAll("'", "''")}'`;

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
