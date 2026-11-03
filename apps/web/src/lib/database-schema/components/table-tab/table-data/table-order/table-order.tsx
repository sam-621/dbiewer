import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowDownIcon, ArrowUpIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';

import type { TableColumnNode, TableOrder } from '../../../../utils/table-view.utils';

type Props = {
  columns: Pick<TableColumnNode, 'name'>[];
  order: TableOrder | null;
  onOrderChange: (order: TableOrder) => void;
};

export const TableOrderSelect = ({ columns, order, onOrderChange }: Props) => {
  const { t } = useTranslation();
  const labelId = useId();
  const items = columns.map(column => ({ value: column.name, label: column.name }));
  const isAscending = order?.direction !== 'DESC';

  return (
    <div className="flex items-center gap-1.5">
      <span id={labelId} className="font-mono text-xs text-sql-kw">
        ORDER BY
      </span>
      <Select
        items={items}
        value={order?.column ?? null}
        onValueChange={(column: string | null) => {
          if (column) onOrderChange({ column, direction: order?.direction ?? 'ASC' });
        }}
      >
        <SelectTrigger
          size="sm"
          aria-labelledby={labelId}
          className="w-auto min-w-28 font-mono text-xs sm:text-xs"
        >
          <SelectValue placeholder={t('None')} />
        </SelectTrigger>
        <SelectPopup>
          {items.map(item => (
            <SelectItem key={item.value} value={item.value} className="font-mono">
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={!order}
        aria-label={isAscending ? t('Ascending') : t('Descending')}
        className="text-muted-foreground"
        onClick={() => {
          if (order) onOrderChange({ ...order, direction: isAscending ? 'DESC' : 'ASC' });
        }}
      >
        {isAscending ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </Button>
    </div>
  );
};
