import { useTranslation } from 'react-i18next';

import { ArrowDownIcon, ArrowUpIcon, KeyIcon } from '@/shared/components/icons/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table';
import { cn } from '@/shared/utils/cn';

import { formatColumnType } from '../../../../utils/database-schema.utils';
import type { TableOrder, TableRowsNode } from '../../../../utils/table-view.utils';

type Props = {
  columns: TableRowsNode['columns'];
  rows: (string | null)[][];
  primaryKey: string | null;
  firstRowNumber: number;
  order: TableOrder | null;
  isStale: boolean;
  onOrderChange: (order: TableOrder) => void;
  selectedRowIndex: number | null;
  onRowOpen: (rowIndex: number) => void;
};

export const TableGrid = ({
  columns,
  rows,
  primaryKey,
  firstRowNumber,
  order,
  isStale,
  onOrderChange,
  selectedRowIndex,
  onRowOpen
}: Props) => {
  const { t } = useTranslation();

  const sortBy = (column: string) =>
    onOrderChange({
      column,
      direction: order?.column === column && order.direction === 'ASC' ? 'DESC' : 'ASC'
    });

  return (
    <Table
      render={<div className={cn('min-h-0 flex-1 overflow-auto', isStale && 'opacity-64')} />}
      className="font-mono text-xs"
    >
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead className="w-px text-end">#</TableHead>
          {columns.map(column => {
            const direction = order && order.column === column.name ? order.direction : null;
            const SortIcon = direction === 'DESC' ? ArrowDownIcon : ArrowUpIcon;

            return (
              <TableHead
                key={column.name}
                aria-sort={
                  direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'none'
                }
                className="p-0"
              >
                <button
                  type="button"
                  className="flex h-full w-full cursor-pointer items-center gap-1.5 px-2.5 text-start outline-none hover:text-foreground focus-visible:text-foreground"
                  onClick={() => sortBy(column.name)}
                >
                  {column.name === primaryKey && (
                    <KeyIcon
                      role="img"
                      aria-hidden={false}
                      aria-label={t('Primary key')}
                      className="size-3.5 text-pk"
                    />
                  )}
                  <span className="text-foreground">{column.name}</span>
                  <span className="font-normal">{formatColumnType(column.type)}</span>
                  <SortIcon
                    className={cn('size-3.5', direction ? 'text-foreground' : 'invisible')}
                  />
                </button>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow
            key={firstRowNumber + rowIndex}
            tabIndex={0}
            data-state={rowIndex === selectedRowIndex ? 'selected' : undefined}
            aria-selected={rowIndex === selectedRowIndex}
            className="cursor-pointer outline-none focus-visible:bg-accent"
            onClick={() => onRowOpen(rowIndex)}
            onKeyDown={event => {
              if (event.key === 'Enter') onRowOpen(rowIndex);
            }}
          >
            <TableCell className="w-px py-1.5 text-end text-muted-foreground tabular-nums">
              {firstRowNumber + rowIndex}
            </TableCell>
            {row.map((value, columnIndex) => (
              <TableCell key={columns[columnIndex]?.name ?? columnIndex} className="py-1.5">
                <span className="flex items-center gap-1">
                  {value === null ? (
                    <span className="text-muted-foreground italic">NULL</span>
                  ) : (
                    <span title={value} className="max-w-80 truncate">
                      {value}
                    </span>
                  )}
                </span>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
