import { useTranslation } from 'react-i18next';

import { DiagramFitViewButton } from '@/lib/diagram/components/diagram/diagram-fit-view-button/diagram-fit-view-button';
import { GridIcon, ReloadIcon } from '@/shared/components/icons/icons';
import { SearchInput } from '@/shared/components/search-input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

type Props = {
  schemas: string[];
  schema: string | null;
  onSchemaChange: (schema: string) => void;
  hasEntities: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onResetLayout: () => void;
  isReloading: boolean;
  onReload: () => void;
};

export const DiagramTabHeader = ({
  schemas,
  schema,
  onSchemaChange,
  hasEntities,
  search,
  onSearchChange,
  onResetLayout,
  isReloading,
  onReload
}: Props) => {
  const { t } = useTranslation();

  return (
    <header className="flex min-h-10.5 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b py-1 ps-3.5 pe-2">
      <h2 className="min-w-0 truncate text-sm font-semibold">{t('Diagram')}</h2>
      <div className="ms-auto flex items-center gap-1">
        {hasEntities && (
          <SearchInput
            className="w-52"
            placeholder={t('Search tables…')}
            value={search}
            onValueChange={onSearchChange}
          />
        )}
        {schemas.length > 1 && (
          <Select value={schema} onValueChange={value => value && onSchemaChange(value)}>
            <SelectTrigger size="sm" aria-label={t('Schema')} className="w-40 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {schemas.map(name => (
                <SelectItem key={name} value={name} className="font-mono text-xs">
                  {name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        )}
        {hasEntities && (
          <>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label={t('Auto layout')}
                    onClick={onResetLayout}
                  />
                }
              >
                <GridIcon className="size-3.5" />
              </TooltipTrigger>
              <TooltipPopup>{t('Auto layout')}</TooltipPopup>
            </Tooltip>
            <DiagramFitViewButton />
          </>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={t('Reload')}
                loading={isReloading}
                onClick={onReload}
              />
            }
          >
            <ReloadIcon className="size-3.5" />
          </TooltipTrigger>
          <TooltipPopup>{t('Reload')}</TooltipPopup>
        </Tooltip>
      </div>
    </header>
  );
};
