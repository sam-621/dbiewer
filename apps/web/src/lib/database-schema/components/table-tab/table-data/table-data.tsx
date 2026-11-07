import { useTranslation } from 'react-i18next';

import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Skeleton } from '@/shared/components/ui/skeleton';

import type { useGetTableRows } from '../../../hooks/use-get-table-rows';
import {
  editTableCell,
  editTableNewRowCell,
  type TableChanges
} from '../../../utils/table-changes.utils';
import {
  formatTableOrder,
  getPrimaryKeyColumns,
  getTableRowKey,
  getTableRowKeyId,
  getVisibleTableRows,
  parseTableOrder,
  TABLE_PAGE_SIZE,
  type TableOrder,
  type TableRowKey,
  type TableStructureNode,
  type TableViewState
} from '../../../utils/table-view.utils';
import { TableTabMessage } from '../table-tab-message/table-tab-message';

import { TableFilterBar } from './table-filter-bar/table-filter-bar';
import { type TableCellRef, TableGrid } from './table-grid/table-grid';
import { TablePagination } from './table-pagination/table-pagination';

type Props = {
  structure: Pick<TableStructureNode, 'columns'>;
  rowsResult: ReturnType<typeof useGetTableRows>;
  state: TableViewState;
  onStateChange: (state: TableViewState) => void;
  hiddenColumns: string[];
  connectionId: string;
  object: { kind: 'table' | 'view'; schema: string; name: string };
  onPin: () => void;
  selectedRowKeys: TableRowKey[];
  onSelectedRowKeysChange: (keys: TableRowKey[]) => void;
  selectedNewRowIds: string[];
  onSelectedNewRowIdsChange: (ids: string[]) => void;
  changes: TableChanges;
  onChangesChange: (changes: TableChanges) => void;
  selectedCell: TableCellRef | null;
  onSelectedCellChange: (cell: TableCellRef | null) => void;
  editingCell: TableCellRef | null;
  onEditingCellChange: (cell: TableCellRef | null) => void;
};

export const TableData = ({
  structure,
  rowsResult,
  state,
  hiddenColumns,
  connectionId,
  object,
  onStateChange,
  onPin,
  selectedRowKeys,
  onSelectedRowKeysChange,
  selectedNewRowIds,
  onSelectedNewRowIdsChange,
  changes,
  onChangesChange,
  selectedCell,
  onSelectedCellChange,
  editingCell,
  onEditingCellChange
}: Props) => {
  const { t } = useTranslation();
  const { tableRows, rowsError, durationMs, isLoading, isFetching, isPlaceholderData, refetch } =
    rowsResult;
  const primaryKeys = getPrimaryKeyColumns(structure.columns);
  const [primaryKey] = primaryKeys;
  const defaultOrder: TableOrder | null = primaryKey
    ? { column: primaryKey, direction: 'ASC' }
    : null;
  const isTable = object.kind === 'table';
  const canSelectRows = isTable && primaryKeys.length > 0;
  const rowKeys = tableRows
    ? tableRows.rows.map(row => getTableRowKey(tableRows.columns, row, primaryKeys))
    : [];
  const selectedIds = new Set(selectedRowKeys.map(getTableRowKeyId));
  const rowEdits = rowKeys.map(key => changes.edits[getTableRowKeyId(key)]?.values ?? {});
  const columns = tableRows?.columns ?? [];
  const shownRows = (tableRows?.rows ?? []).map((row, rowIndex) =>
    row.map((value, columnIndex) => {
      const edits = rowEdits[rowIndex] ?? {};
      const column = columns[columnIndex]?.name ?? '';
      return column in edits ? (edits[column] ?? null) : value;
    })
  );
  const changedCells = rowEdits.map(edits => columns.map(column => column.name in edits));
  const newRowValues = changes.newRows.map(row =>
    columns.map(column =>
      column.name in row.values ? (row.values[column.name] ?? null) : undefined
    )
  );
  const order = state.orderBy ? parseTableOrder(state.orderBy) : defaultOrder;

  const firstRowNumber = (state.page - 1) * TABLE_PAGE_SIZE + 1;

  const toggleRow = (rowIndex: number) => {
    const key = rowKeys[rowIndex];
    if (!key) return;

    const id = getTableRowKeyId(key);
    onSelectedRowKeysChange(
      selectedIds.has(id)
        ? selectedRowKeys.filter(selected => getTableRowKeyId(selected) !== id)
        : [...selectedRowKeys, key]
    );
  };

  const toggleNewRow = (id: string) =>
    onSelectedNewRowIdsChange(
      selectedNewRowIds.includes(id)
        ? selectedNewRowIds.filter(selected => selected !== id)
        : [...selectedNewRowIds, id]
    );

  const editCell = (cell: TableCellRef) => {
    onSelectedCellChange(cell);
    onEditingCellChange(cell);
  };

  const changeCell = (value: string | null | undefined) => {
    if (!editingCell || !tableRows) return;

    const { row, column } = editingCell;

    if (typeof row === 'string') {
      return onChangesChange(
        editTableNewRowCell(changes, { id: row, column, value: value === undefined ? '' : value })
      );
    }

    const key = rowKeys[row];
    if (!key || value === undefined) return;

    const columnIndex = tableRows.columns.findIndex(({ name }) => name === column);
    const original = tableRows.rows[row]?.[columnIndex] ?? null;
    onChangesChange(editTableCell(changes, { key, column, value, original }));
  };

  const changeOrder = (nextOrder: TableOrder) =>
    onStateChange({ ...state, orderBy: formatTableOrder(nextOrder), page: 1 });

  const renderGrid = () => {
    if (isLoading) {
      return (
        <div role="status" aria-label={t('Loading rows')} className="flex flex-col gap-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>
      );
    }

    if (rowsError || !tableRows) {
      return (
        <TableTabMessage error={rowsError} isRetrying={isFetching} onRetry={() => refetch()} />
      );
    }

    if (!tableRows.rows.length && !changes.newRows.length) {
      return (
        <Empty className="md:py-12">
          <EmptyHeader>
            <EmptyTitle className="text-base">
              {state.where ? t('No rows match these filters') : t('This table has no rows')}
            </EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <TableGrid
        {...getVisibleTableRows({ columns, rows: shownRows }, hiddenColumns)}
        changedCells={getVisibleTableRows({ columns, rows: changedCells }, hiddenColumns).rows}
        newRows={changes.newRows.map((row, index) => ({
          id: row.id,
          values:
            getVisibleTableRows({ columns, rows: [newRowValues[index] ?? []] }, hiddenColumns)
              .rows[0] ?? []
        }))}
        primaryKeys={primaryKeys}
        firstRowNumber={firstRowNumber}
        order={order}
        isStale={isPlaceholderData}
        onOrderChange={changeOrder}
        checkedRows={
          canSelectRows ? rowKeys.map(key => selectedIds.has(getTableRowKeyId(key))) : undefined
        }
        onRowCheck={canSelectRows ? toggleRow : undefined}
        checkedNewRows={
          canSelectRows ? changes.newRows.map(row => selectedNewRowIds.includes(row.id)) : undefined
        }
        onNewRowCheck={canSelectRows ? toggleNewRow : undefined}
        canEditRows={canSelectRows}
        selectedCell={selectedCell}
        onCellSelect={onSelectedCellChange}
        editingCell={editingCell}
        onCellEdit={isTable ? editCell : undefined}
        onCellChange={changeCell}
        onCellEditEnd={() => onEditingCellChange(null)}
        className="pb-14"
      />
    );
  };

  return (
    <>
      <TableFilterBar
        connectionId={connectionId}
        object={object}
        where={state.where}
        orderBy={state.orderBy}
        onWhereChange={where => onStateChange({ ...state, where, page: 1 })}
        onOrderByChange={orderBy => onStateChange({ ...state, orderBy, page: 1 })}
        onPin={onPin}
      />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {renderGrid()}
        {tableRows && !rowsError && (
          <TablePagination
            firstRowNumber={firstRowNumber}
            shownRows={tableRows.rows.length}
            totalRows={tableRows.totalRows}
            durationMs={durationMs}
            page={state.page}
            onPageChange={page => onStateChange({ ...state, page })}
          />
        )}
      </div>
    </>
  );
};
