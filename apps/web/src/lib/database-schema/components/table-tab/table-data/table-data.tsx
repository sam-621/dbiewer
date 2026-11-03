import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Skeleton } from '@/shared/components/ui/skeleton';

import type { useGetTableRows } from '../../../hooks/use-get-table-rows';
import {
  TABLE_PAGE_SIZE,
  type TableOrder,
  type TableStructureNode,
  type TableViewState
} from '../../../utils/table-view.utils';
import { TableTabMessage } from '../table-tab-message/table-tab-message';

import { TableFilters } from './table-filters/table-filters';
import { TableGrid } from './table-grid/table-grid';
import { TableOrderSelect } from './table-order/table-order';
import { TablePagination } from './table-pagination/table-pagination';
import { type TableRowDetail, TableRowSheet } from './table-row-sheet/table-row-sheet';

type Props = {
  structure: Pick<TableStructureNode, 'columns'>;
  rowsResult: ReturnType<typeof useGetTableRows>;
  state: TableViewState;
  onStateChange: (state: TableViewState) => void;
  objectName: string;
  onPin: () => void;
};

export const TableData = ({
  structure,
  rowsResult,
  state,
  objectName,
  onStateChange,
  onPin
}: Props) => {
  const { t } = useTranslation();
  const { tableRows, rowsError, durationMs, isLoading, isFetching, isPlaceholderData, refetch } =
    rowsResult;
  const primaryKey = structure.columns.find(column => column.isPrimaryKey)?.name ?? null;
  const order: TableOrder | null =
    state.orderBy ?? (primaryKey ? { column: primaryKey, direction: 'ASC' } : null);

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

  const changeOrder = (orderBy: TableOrder) => onStateChange({ ...state, orderBy, page: 1 });

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
              {state.filters.length
                ? t('No rows match these filters')
                : t('This table has no rows')}
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
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
        <TableFilters
          columns={structure.columns}
          filters={state.filters}
          onFiltersChange={filters => onStateChange({ ...state, filters, page: 1 })}
        />
        <TableOrderSelect columns={structure.columns} order={order} onOrderChange={changeOrder} />
      </div>
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
          objectName={objectName}
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
