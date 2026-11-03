import { useTranslation } from 'react-i18next';

import { EyeIcon, ReloadIcon, TableIcon } from '@/shared/components/icons/icons';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TabsList, TabsTab } from '@/shared/components/ui/tabs';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

import { useGetConnectionSchema } from '../../../hooks/use-get-connection-schema';
import type { TableTabObject } from '../table-tab';

type Props = {
  connectionId: string;
  object: TableTabObject;
  totalRows: number | null;
  totalColumns: number | null;
  isReloading: boolean;
  onReload: () => void;
};

export const TableTabHeader = ({
  connectionId,
  object,
  totalRows,
  totalColumns,
  isReloading,
  onReload
}: Props) => {
  const { t } = useTranslation();
  const { schemas } = useGetConnectionSchema(connectionId);
  const Icon = object.kind === 'table' ? TableIcon : EyeIcon;

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <h2 className="truncate font-mono text-sm font-semibold">
          {schemas.length > 1 && (
            <span className="font-normal text-muted-foreground">{object.schema}.</span>
          )}
          {object.name}
        </h2>
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {totalRows !== null && t('{{count, number}} rows', { count: totalRows })}
        {totalRows !== null && totalColumns !== null && ' · '}
        {totalColumns !== null && t('{{count, number}} columns', { count: totalColumns })}
      </p>
      {object.kind === 'view' && <Badge variant="warning">{t('View · read only')}</Badge>}
      <div className="ms-auto flex items-center gap-1">
        <TabsList size="sm" className="grid grid-cols-2">
          <TabsTab value="data">{t('Data')}</TabsTab>
          <TabsTab value="structure">{t('Structure')}</TabsTab>
        </TabsList>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Reload')}
                loading={isReloading}
                onClick={onReload}
              />
            }
          >
            <ReloadIcon />
          </TooltipTrigger>
          <TooltipPopup>{t('Reload')}</TooltipPopup>
        </Tooltip>
      </div>
    </header>
  );
};
