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
  primaryKey?: string | null;
  firstRowNumber?: number;
  order?: TableOrder | null;
  isStale?: boolean;
  onOrderChange?: (order: TableOrder) => void;
  selectedRowIndex?: number | null;
  onRowOpen?: (rowIndex: number) => void;
  className?: string;
};

export const TableGrid = ({
  columns,
  rows,
  primaryKey = null,
  firstRowNumber = 1,
  order = null,
  isStale = false,
  onOrderChange,
  selectedRowIndex = null,
  onRowOpen,
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
        {rows.map((row, rowIndex) => (
          <TableRow
            key={firstRowNumber + rowIndex}
            tabIndex={onRowOpen ? 0 : undefined}
            data-state={rowIndex === selectedRowIndex ? 'selected' : undefined}
            aria-selected={onRowOpen ? rowIndex === selectedRowIndex : undefined}
            className={cn(onRowOpen && 'cursor-pointer outline-none focus-visible:bg-accent')}
            onClick={onRowOpen && (() => onRowOpen(rowIndex))}
            onKeyDown={
              onRowOpen &&
              (event => {
                if (event.key === 'Enter') onRowOpen(rowIndex);
              })
            }
          >
            <TableCell className="w-px py-1.5 text-end text-muted-foreground tabular-nums">
              {firstRowNumber + rowIndex}
            </TableCell>
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
        ))}
      </TableBody>
    </Table>
  );
};
