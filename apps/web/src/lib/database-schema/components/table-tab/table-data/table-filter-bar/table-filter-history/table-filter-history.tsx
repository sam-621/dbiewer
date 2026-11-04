import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, type Icon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/shared/components/ui/menu';
import { ScrollArea } from '@/shared/components/ui/scroll-area';

type Props = {
  icon: Icon;
  label: string;
  items: string[];
  finalFocus: RefObject<HTMLElement | null>;
  onSelect: (text: string) => void;
};

export const TableFilterHistory = ({
  icon: FieldIcon,
  label,
  items,
  finalFocus,
  onSelect
}: Props) => {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            aria-label={label}
            className="shrink-0 gap-1 px-1 text-muted-foreground"
          />
        }
      >
        <FieldIcon />
        <ChevronDownIcon className="size-3" />
      </MenuTrigger>
      <MenuPopup align="start" finalFocus={finalFocus} className="w-96 max-w-(--available-width)">
        {items.length ? (
          <ScrollArea className="flex max-h-35 flex-col" overscrollContain scrollFade>
            {items.map(item => (
              <MenuItem
                key={item}
                className="min-h-7 font-mono text-xs sm:min-h-7 sm:text-xs"
                onClick={() => onSelect(item)}
              >
                <span title={item} className="min-w-0 truncate">
                  {item}
                </span>
              </MenuItem>
            ))}
          </ScrollArea>
        ) : (
          <p className="px-2 py-1 text-sm text-muted-foreground">{t('No history yet')}</p>
        )}
      </MenuPopup>
    </Menu>
  );
};
