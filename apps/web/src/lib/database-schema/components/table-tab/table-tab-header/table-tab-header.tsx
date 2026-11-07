import { useTranslation } from 'react-i18next';

import { ReloadIcon } from '@/shared/components/icons/icons';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TabsList, TabsTab } from '@/shared/components/ui/tabs';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

import type { TableColumnNode, TableRowKey, TableViewState } from '../../../utils/table-view.utils';
import type { TableTabObject } from '../table-tab';

import { DeleteTableRowsDialog } from './delete-table-rows-dialog/delete-table-rows-dialog';
import { TableColumnsMenu } from './table-columns-menu/table-columns-menu';

type Props = {
  connectionId: string;
  object: TableTabObject;
  view: TableViewState['view'];
  totalRows: number | null;
  columns: TableColumnNode[] | null;
  hiddenColumns: string[];
  onHiddenColumnsChange: (hiddenColumns: string[]) => void;
  isReloading: boolean;
  onReload: () => void;
  selectedRowKeys: TableRowKey[];
  onRowsDeleted: () => void;
};

export const TableTabHeader = ({
  connectionId,
  object,
  view,
  totalRows,
  columns,
  hiddenColumns,
  onHiddenColumnsChange,
  isReloading,
  onReload,
  selectedRowKeys,
  onRowsDeleted
}: Props) => {
  const { t } = useTranslation();
  const canDeleteRows =
    object.kind === 'table' && view === 'data' && !!columns?.some(column => column.isPrimaryKey);

  return (
    <header className="flex min-h-10.5 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b py-1 ps-3.5 pe-2">
      <h2 className="min-w-0 truncate text-sm font-semibold">{object.name}</h2>
      <p className="text-xs text-muted-foreground">
        {totalRows !== null && t('{{count, number}} rows', { count: totalRows })}
      </p>
      {canDeleteRows && (
        <DeleteTableRowsDialog
          connectionId={connectionId}
          object={object}
          rowKeys={selectedRowKeys}
          onDeleted={onRowsDeleted}
        />
      )}
      {object.kind === 'view' && <Badge variant="warning">{t('View · read only')}</Badge>}
      <div className="ms-auto flex items-center gap-1">
        {view === 'data' && columns && (
          <TableColumnsMenu
            columns={columns}
            hiddenColumns={hiddenColumns}
            onHiddenColumnsChange={onHiddenColumnsChange}
          />
        )}
        <TabsList size="sm" className="grid grid-cols-2">
          <TabsTab value="data" className="font-normal">
            {t('Data')}
          </TabsTab>
          <TabsTab value="structure" className="font-normal">
            {t('Structure')}
          </TabsTab>
        </TabsList>
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
