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
  primaryKeys?: string[];
  firstRowNumber?: number;
  order?: TableOrder | null;
  isStale?: boolean;
  onOrderChange?: (order: TableOrder) => void;
  selectedRowIndex?: number | null;
  onRowOpen?: (rowIndex: number) => void;
  checkedRows?: boolean[];
  onRowCheck?: (rowIndex: number) => void;
  className?: string;
};

export const TableGrid = ({
  columns,
  rows,
  primaryKeys = [],
  firstRowNumber = 1,
  order = null,
  isStale = false,
  onOrderChange,
  selectedRowIndex = null,
  onRowOpen,
  checkedRows,
  onRowCheck,
  className
}: Props) => {
  const { t } = useTranslation();

  const sortBy = (column: string) =>
    onOrderChange?.({
      column,
      direction: order?.column === column && order.direction === 'ASC' ? 'DESC' : 'ASC'
    });

  return (
    <Table
      render={
        <div className={cn('min-h-0 flex-1 overflow-auto', isStale && 'opacity-64', className)} />
      }
      className="border-separate border-spacing-0 font-mono text-xs [&_td]:border-e [&_td]:border-b [&_th]:border-e [&_th]:border-b"
    >
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead className="w-px text-end">#</TableHead>
          {columns.map((column, columnIndex) => {
            const direction = order && order.column === column.name ? order.direction : null;
            const SortIcon = direction === 'DESC' ? ArrowDownIcon : ArrowUpIcon;

            const content = (
              <>
                {primaryKeys.includes(column.name) && (
                  <KeyIcon
                    role="img"
                    aria-hidden={false}
                    aria-label={t('Primary key')}
                    className="size-3.5 text-pk"
                  />
                )}
                <span className="text-foreground">{column.name}</span>
                <span className="font-normal">{formatColumnType(column.type)}</span>
              </>
            );

            if (!onOrderChange) {
              return (
                <TableHead key={columnIndex}>
                  <span className="flex items-center gap-1.5">{content}</span>
                </TableHead>
              );
            }

            return (
              <TableHead
                key={columnIndex}
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
                  {content}
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
        {rows.map((row, rowIndex) => {
          const rowNumber = firstRowNumber + rowIndex;
          const isChecked = !!checkedRows?.[rowIndex];
          const isSelected = rowIndex === selectedRowIndex || isChecked;

          return (
            <TableRow
              key={rowNumber}
              tabIndex={onRowOpen ? 0 : undefined}
              data-state={isSelected ? 'selected' : undefined}
              aria-selected={onRowOpen ? rowIndex === selectedRowIndex : undefined}
              className={cn(
                onRowOpen && 'cursor-pointer outline-none focus-visible:bg-accent',
                isChecked && '*:bg-primary/12 dark:*:bg-primary/10'
              )}
              onClick={onRowOpen && (() => onRowOpen(rowIndex))}
              onKeyDown={
                onRowOpen &&
                (event => {
                  if (event.key === 'Enter') onRowOpen(rowIndex);
                })
              }
            >
              {onRowCheck ? (
                <TableCell
                  className={cn(
                    'w-px p-0 text-muted-foreground tabular-nums',
                    isChecked && 'text-foreground'
                  )}
                >
                  <button
                    type="button"
                    aria-label={t('Select row {{number, number}}', { number: rowNumber })}
                    aria-pressed={isChecked}
                    className="flex h-full w-full cursor-pointer items-center justify-end px-2.5 py-1.5 outline-none hover:text-foreground focus-visible:text-foreground"
                    onClick={event => {
                      event.stopPropagation();
                      onRowCheck(rowIndex);
                    }}
                    onKeyDown={event => event.stopPropagation()}
                  >
                    {rowNumber}
                  </button>
                </TableCell>
              ) : (
                <TableCell className="w-px py-1.5 text-end text-muted-foreground tabular-nums">
                  {rowNumber}
                </TableCell>
              )}
              {row.map((value, columnIndex) => (
                <TableCell key={columnIndex} className="py-1.5">
                  <span className="flex items-center gap-1">
                    {value === null ? (
                      <span className="text-muted-foreground/70 italic">NULL</span>
                    ) : (
                      <span title={value} className="max-w-80 truncate text-foreground/70">
                        {value}
                      </span>
                    )}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
