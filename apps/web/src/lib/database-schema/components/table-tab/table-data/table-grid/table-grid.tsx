import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowDownIcon, ArrowUpIcon, KeyIcon, PlusIcon } from '@/shared/components/icons/icons';
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

import { TableCellEditor } from './table-cell-editor/table-cell-editor';

export type TableCellRef = { row: number | string; column: string };

export type TableGridNewRow = { id: string; values: (string | null | undefined)[] };

type Props = {
  columns: TableRowsNode['columns'];
  rows: (string | null)[][];
  primaryKeys?: string[];
  firstRowNumber?: number;
  order?: TableOrder | null;
  isStale?: boolean;
  onOrderChange?: (order: TableOrder) => void;
  checkedRows?: boolean[];
  onRowCheck?: (rowIndex: number) => void;
  changedCells?: boolean[][];
  newRows?: TableGridNewRow[];
  checkedNewRows?: boolean[];
  onNewRowCheck?: (id: string) => void;
  canEditRows?: boolean;
  selectedCell?: TableCellRef | null;
  onCellSelect?: (cell: TableCellRef) => void;
  editingCell?: TableCellRef | null;
  onCellEdit?: (cell: TableCellRef) => void;
  onCellChange?: (value: string | null | undefined) => void;
  onCellEditEnd?: () => void;
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
  checkedRows,
  onRowCheck,
  changedCells,
  newRows = [],
  checkedNewRows,
  onNewRowCheck,
  canEditRows = false,
  selectedCell = null,
  onCellSelect,
  editingCell = null,
  onCellEdit,
  onCellChange,
  onCellEditEnd,
  className
}: Props) => {
  const { t } = useTranslation();
  const tableRef = useRef<HTMLTableElement>(null);
  const columnNames = columns.map(column => column.name);
  const rowRefs: (number | string)[] = [
    ...rows.map((_, index) => index),
    ...newRows.map(({ id }) => id)
  ];
  const selectedCellId = selectedCell ? getCellId(selectedCell) : null;
  const isEditingCell = !!editingCell;

  useEffect(() => {
    if (!selectedCellId || isEditingCell) return;

    tableRef.current
      ?.querySelector<HTMLElement>(`[data-cell="${CSS.escape(selectedCellId)}"]`)
      ?.focus();
  }, [selectedCellId, isEditingCell]);

  const moveSelection = (direction: 1 | -1) => {
    if (!selectedCell) return;

    const rowIndex = rowRefs.indexOf(selectedCell.row);
    const position = rowIndex * columnNames.length + columnNames.indexOf(selectedCell.column);
    const next = position + direction;
    const row = rowRefs[Math.floor(next / columnNames.length)];
    const column = columnNames[next % columnNames.length];

    onCellEditEnd?.();
    if (next >= 0 && row !== undefined && column !== undefined) onCellSelect?.({ row, column });
  };

  const renderValue = (value: string | null | undefined) => {
    if (value === undefined)
      return <span className="text-muted-foreground/70 italic">DEFAULT</span>;
    if (value === null) return <span className="text-muted-foreground/70 italic">NULL</span>;

    return (
      <span title={value} className="max-w-80 truncate text-foreground/70">
        {value}
      </span>
    );
  };

  const renderCell = (
    row: number | string,
    columnIndex: number,
    value: string | null | undefined,
    { isEditable, isChanged }: { isEditable: boolean; isChanged: boolean }
  ) => {
    const column = columns[columnIndex]?.name ?? '';

    const cell = { row, column };
    const isEditing = editingCell?.row === row && editingCell.column === column;
    const isSelected = selectedCellId === getCellId(cell);

    return (
      <TableCell
        key={columnIndex}
        data-cell={onCellSelect ? getCellId(cell) : undefined}
        data-changed={isChanged || undefined}
        aria-selected={onCellSelect ? isSelected : undefined}
        tabIndex={onCellSelect ? (isSelected ? 0 : -1) : undefined}
        className={cn(
          'relative py-1.5 outline-none',
          isChanged && 'bg-info/16',
          isSelected && 'ring-1 ring-ring ring-inset'
        )}
        onClick={onCellSelect && (() => onCellSelect(cell))}
        onDoubleClick={isEditable && !isEditing ? () => onCellEdit?.(cell) : undefined}
        onKeyDown={
          isEditable && !isEditing
            ? event => {
                if (event.key === 'Enter') onCellEdit?.(cell);
              }
            : undefined
        }
      >
        {isEditing ? (
          <TableCellEditor
            column={column}
            value={value}
            onChange={value => onCellChange?.(value)}
            onDone={() => onCellEditEnd?.()}
            onMove={moveSelection}
          />
        ) : (
          <span className="flex items-center gap-1">{renderValue(value)}</span>
        )}
      </TableCell>
    );
  };

  const renderNumeral = (
    content: ReactNode,
    label: string,
    isChecked: boolean,
    onCheck: (() => void) | undefined
  ) => {
    if (!onCheck) {
      return (
        <TableCell className="w-14 min-w-14 py-1.5 text-end text-muted-foreground tabular-nums">
          {content}
        </TableCell>
      );
    }

    return (
      <TableCell
        className={cn(
          'w-14 min-w-14 p-0 text-muted-foreground tabular-nums',
          isChecked && 'text-foreground'
        )}
      >
        <button
          type="button"
          aria-label={label}
          aria-pressed={isChecked}
          className="flex h-full w-full cursor-pointer items-center justify-end px-2.5 py-1.5 outline-none hover:text-foreground focus-visible:text-foreground"
          onClick={event => {
            event.stopPropagation();
            onCheck();
          }}
          onKeyDown={event => event.stopPropagation()}
        >
          {content}
        </button>
      </TableCell>
    );
  };

  const sortBy = (column: string) =>
    onOrderChange?.({
      column,
      direction: order?.column === column && order.direction === 'ASC' ? 'DESC' : 'ASC'
    });

  return (
    <Table
      ref={tableRef}
      render={
        <div className={cn('min-h-0 flex-1 overflow-auto', isStale && 'opacity-64', className)} />
      }
      className="border-separate border-spacing-0 font-mono text-xs [&_td]:border-e [&_td]:border-b [&_th]:border-e [&_th]:border-b"
    >
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          <TableHead className="w-14 min-w-14 text-end">#</TableHead>
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

          return (
            <TableRow
              key={rowNumber}
              data-state={isChecked ? 'selected' : undefined}
              className={cn(isChecked && '*:bg-primary/12 dark:*:bg-primary/10')}
            >
              {renderNumeral(
                rowNumber,
                t('Select row {{number, number}}', { number: rowNumber }),
                isChecked,
                onRowCheck && (() => onRowCheck(rowIndex))
              )}
              {row.map((value, columnIndex) =>
                renderCell(rowIndex, columnIndex, value, {
                  isEditable: canEditRows && !!onCellEdit,
                  isChanged: !!changedCells?.[rowIndex]?.[columnIndex]
                })
              )}
            </TableRow>
          );
        })}
        {newRows.map((newRow, newRowIndex) => {
          const isChecked = !!checkedNewRows?.[newRowIndex];

          return (
            <TableRow
              key={`new:${newRow.id}`}
              data-new
              aria-label={t('New row {{number, number}}', { number: newRowIndex + 1 })}
              className={cn('*:bg-success/8', isChecked && '*:bg-primary/12 dark:*:bg-primary/10')}
            >
              {renderNumeral(
                <PlusIcon className="ms-auto size-3" />,
                t('Select new row {{number, number}}', { number: newRowIndex + 1 }),
                isChecked,
                onNewRowCheck && (() => onNewRowCheck(newRow.id))
              )}
              {newRow.values.map((value, columnIndex) =>
                renderCell(newRow.id, columnIndex, value, {
                  isEditable: !!onCellEdit,
                  isChanged: false
                })
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const getCellId = ({ row, column }: TableCellRef) => JSON.stringify([row, column]);
