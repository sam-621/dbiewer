import { type ReactElement, type ReactNode, useState } from 'react';

import { Popover, PopoverPopup, PopoverTrigger } from '@/shared/components/ui/popover';

import type { TableColumnNode, TableFilter } from '../../../../utils/table-view.utils';

import { TableFilterForm } from './table-filter-form';

type Props = {
  columns: Pick<TableColumnNode, 'name'>[];
  filter?: TableFilter;
  onApply: (filter: TableFilter) => void;
  trigger: ReactElement;
  children: ReactNode;
};

export const TableFilterPopover = ({ columns, filter, onApply, trigger, children }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const apply = (nextFilter: TableFilter) => {
    setIsOpen(false);
    onApply(nextFilter);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={trigger}>{children}</PopoverTrigger>
      <PopoverPopup align="start" className="w-72">
        <TableFilterForm columns={columns} filter={filter} onApply={apply} />
      </PopoverPopup>
    </Popover>
  );
};
