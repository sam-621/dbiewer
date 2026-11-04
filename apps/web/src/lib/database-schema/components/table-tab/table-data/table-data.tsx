import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Skeleton } from '@/shared/components/ui/skeleton';

import type { useGetTableRows } from '../../../hooks/use-get-table-rows';
import {
  formatTableOrder,
  parseTableOrder,
  TABLE_PAGE_SIZE,
  type TableOrder,
  type TableStructureNode,
  type TableViewState
} from '../../../utils/table-view.utils';
import { TableTabMessage } from '../table-tab-message/table-tab-message';

import { TableFilterBar } from './table-filter-bar/table-filter-bar';
import { TableGrid } from './table-grid/table-grid';
import { TablePagination } from './table-pagination/table-pagination';
import { type TableRowDetail, TableRowSheet } from './table-row-sheet/table-row-sheet';

type Props = {
  structure: Pick<TableStructureNode, 'columns'>;
  rowsResult: ReturnType<typeof useGetTableRows>;
  state: TableViewState;
  onStateChange: (state: TableViewState) => void;
  connectionId: string;
  object: { schema: string; name: string };
  onPin: () => void;
};

export const TableData = ({
  structure,
  rowsResult,
  state,
  connectionId,
  object,
  onStateChange,
  onPin
}: Props) => {
  const { t } = useTranslation();
  const { tableRows, rowsError, durationMs, isLoading, isFetching, isPlaceholderData, refetch } =
    rowsResult;
  const primaryKey = structure.columns.find(column => column.isPrimaryKey)?.name ?? null;
  const defaultOrder: TableOrder | null = primaryKey
    ? { column: primaryKey, direction: 'ASC' }
    : null;
  const order = state.orderBy ? parseTableOrder(state.orderBy) : defaultOrder;

  const [shownRow, setShownRow] = useState<(TableRowDetail & { index: number }) | null>(null);
  const [isRowOpen, setIsRowOpen] = useState(false);
  const firstRowNumber = (state.page - 1) * TABLE_PAGE_SIZE + 1;

  const openRow = (rowIndex: number) => {
    const values = tableRows?.rows[rowIndex];
    if (!values) return;

    setShownRow({ index: rowIndex, number: firstRowNumber + rowIndex, values });
    setIsRowOpen(true);
    onPin();
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

    if (!tableRows.rows.length) {
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
        columns={tableRows.columns}
        rows={tableRows.rows}
        primaryKey={primaryKey}
        firstRowNumber={firstRowNumber}
        order={order}
        isStale={isPlaceholderData}
        onOrderChange={changeOrder}
        selectedRowIndex={isRowOpen && shownRow ? shownRow.index : null}
        onRowOpen={openRow}
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
      {renderGrid()}
      {tableRows && !rowsError && (
        <TablePagination
          shownRows={tableRows.rows.length}
          totalRows={tableRows.totalRows}
          durationMs={durationMs}
          page={state.page}
          onPageChange={page => onStateChange({ ...state, page })}
        />
      )}
      {tableRows && (
        <TableRowSheet
          objectName={object.name}
          columns={tableRows.columns}
          primaryKey={primaryKey}
          isOpen={isRowOpen}
          row={shownRow}
          onClose={() => setIsRowOpen(false)}
        />
      )}
    </>
  );
};
