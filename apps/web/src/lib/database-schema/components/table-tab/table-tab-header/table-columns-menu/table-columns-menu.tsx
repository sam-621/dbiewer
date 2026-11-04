import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MagnifyingGlassIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';
import { Label } from '@/shared/components/ui/label';
import { Popover, PopoverPopup, PopoverTrigger } from '@/shared/components/ui/popover';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

import { formatColumnType } from '../../../../utils/database-schema.utils';
import type { TableColumnNode } from '../../../../utils/table-view.utils';

type Props = {
  columns: Pick<TableColumnNode, 'name' | 'type'>[];
  hiddenColumns: string[];
  onHiddenColumnsChange: (hiddenColumns: string[]) => void;
};

export const TableColumnsMenu = ({ columns, hiddenColumns, onHiddenColumnsChange }: Props) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const visibleCount = columns.filter(column => !hiddenColumns.includes(column.name)).length;
  const hasHiddenColumns = visibleCount < columns.length;
  const term = search.trim().toLowerCase();
  const matches = columns.filter(column => column.name.toLowerCase().includes(term));

  const toggleColumn = (name: string, isVisible: boolean) =>
    onHiddenColumnsChange(
      isVisible ? hiddenColumns.filter(column => column !== name) : [...hiddenColumns, name]
    );

  return (
    <Popover
      onOpenChangeComplete={isOpen => {
        if (!isOpen) setSearch('');
      }}
    >
      <PopoverTrigger
        render={<Button variant="ghost" size="sm" className="font-normal text-muted-foreground" />}
      >
        {t('Columns')}
        <span className="tabular-nums">
          {visibleCount}/{columns.length}
        </span>
      </PopoverTrigger>
      <PopoverPopup align="end" className="w-80 max-w-(--available-width)">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InputGroup>
              <InputGroupAddon>
                <MagnifyingGlassIcon />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                size="sm"
                aria-label={t('Search columns…')}
                placeholder={t('Search columns…')}
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </InputGroup>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={!hasHiddenColumns}
              onClick={() => onHiddenColumnsChange([])}
            >
              {t('Show all')}
            </Button>
          </div>
          {matches.length ? (
            <ScrollArea className="flex max-h-64 flex-col" overscrollContain scrollFade>
              {matches.map(column => {
                const isVisible = !hiddenColumns.includes(column.name);

                return (
                  <Label
                    key={column.name}
                    className="flex min-h-7 gap-2 rounded-sm px-1 font-mono text-xs font-normal hover:bg-accent sm:text-xs"
                  >
                    <Checkbox
                      checked={isVisible}
                      disabled={isVisible && visibleCount === 1}
                      onCheckedChange={checked => toggleColumn(column.name, checked)}
                    />
                    <span title={column.name} className="min-w-0 truncate">
                      {column.name}
                    </span>
                    <span className="ms-auto min-w-0 truncate text-muted-foreground">
                      {formatColumnType(column.type)}
                    </span>
                  </Label>
                );
              })}
            </ScrollArea>
          ) : (
            <p className="px-1 py-1 text-sm text-muted-foreground">
              {t('No results for “{{search}}”', { search: search.trim() })}
            </p>
          )}
        </div>
      </PopoverPopup>
    </Popover>
  );
};
