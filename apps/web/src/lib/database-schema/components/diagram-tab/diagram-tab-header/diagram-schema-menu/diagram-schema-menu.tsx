import { useTranslation } from 'react-i18next';

import { ChevronDownIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger
} from '@/shared/components/ui/menu';

type Props = {
  schemas: string[];
  schema: string | null;
  onSchemaChange: (schema: string) => void;
};

export const DiagramSchemaMenu = ({ schemas, schema, onSchemaChange }: Props) => {
  const { t } = useTranslation();

  return (
    <Menu>
      <MenuTrigger
        aria-label={t('Schema')}
        render={
          <Button
            variant="ghost"
            size="sm"
            className="max-w-40 font-normal text-muted-foreground"
          />
        }
      >
        <span title={schema ?? undefined} className="min-w-0 truncate font-mono text-xs">
          {schema}
        </span>
        <ChevronDownIcon className="size-3.5" />
      </MenuTrigger>
      <MenuPopup align="end">
        <MenuRadioGroup value={schema} onValueChange={onSchemaChange}>
          {schemas.map(name => (
            <MenuRadioItem
              key={name}
              value={name}
              closeOnClick
              className="grid-cols-[1fr_.75rem] gap-6 pe-3 font-mono text-xs *:row-start-1 sm:text-xs [&>span:last-child]:col-start-1 [&>span:last-child]:min-w-0 [&>span:not(:last-child)]:col-start-2 [&>span:not(:last-child)]:ms-0 [&>span:not(:last-child)]:justify-self-end"
            >
              {name}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
};
