import { useTranslation } from 'react-i18next';

import { PlusIcon, XIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';

import type { TableColumnNode, TableFilter } from '../../../../utils/table-view.utils';
import { TableFilterLabel } from '../table-filter-popover/table-filter-label';
import { TableFilterPopover } from '../table-filter-popover/table-filter-popover';

type Props = {
  columns: Pick<TableColumnNode, 'name'>[];
  filters: TableFilter[];
  onFiltersChange: (filters: TableFilter[]) => void;
};

export const TableFilters = ({ columns, filters, onFiltersChange }: Props) => {
  const { t } = useTranslation();

  const replaceFilter = (index: number, filter: TableFilter) =>
    onFiltersChange(filters.map((current, i) => (i === index ? filter : current)));

  const removeFilter = (index: number) => onFiltersChange(filters.filter((_, i) => i !== index));

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <span className="font-mono text-xs text-sql-kw">WHERE</span>
      {filters.map((filter, index) => (
        <span
          key={`${filter.column}-${index}`}
          className="flex h-7 items-center rounded-md border bg-background ps-2 sm:h-6"
        >
          <TableFilterPopover
            columns={columns}
            filter={filter}
            onApply={nextFilter => replaceFilter(index, nextFilter)}
            trigger={
              <button
                type="button"
                title={t('Edit filter')}
                className="cursor-pointer outline-none focus-visible:underline"
              />
            }
          >
            <TableFilterLabel filter={filter} />
          </TableFilterPopover>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Remove filter')}
            className="ms-0.5 text-muted-foreground"
            onClick={() => removeFilter(index)}
          >
            <XIcon />
          </Button>
        </span>
      ))}
      <TableFilterPopover
        columns={columns}
        onApply={filter => onFiltersChange([...filters, filter])}
        trigger={<Button variant="ghost" size="xs" className="text-muted-foreground" />}
      >
        <PlusIcon />
        {t('Add filter')}
      </TableFilterPopover>
    </div>
  );
};
