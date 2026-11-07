import { useTranslation } from 'react-i18next';

import { PlusIcon, ReloadIcon } from '@/shared/components/icons/icons';
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
  selectedNewRowsCount: number;
  onNewRowsRemove: () => void;
  onRowsDeleted: (rowKeys: TableRowKey[]) => void;
  changesCount: number;
  isSaving: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRowAdd: () => void;
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
  selectedNewRowsCount,
  onNewRowsRemove,
  onRowsDeleted,
  changesCount,
  isSaving,
  onSave,
  onUndo,
  onRowAdd
}: Props) => {
  const { t } = useTranslation();
  const canChangeRows = object.kind === 'table' && view === 'data' && !!columns;
  const hasPrimaryKey = !!columns?.some(column => column.isPrimaryKey);
  const addLabel = hasPrimaryKey ? t('Add row') : t('Without a primary key, you can only add rows');

  return (
    <header className="flex min-h-10.5 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 border-b py-1 ps-3.5 pe-2">
      <h2 className="min-w-0 truncate text-sm font-semibold">{object.name}</h2>
      <p className="text-xs text-muted-foreground">
        {totalRows !== null && t('{{count, number}} rows', { count: totalRows })}
      </p>
      {canChangeRows && (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={t('Add row')}
                  onClick={onRowAdd}
                />
              }
            >
              <PlusIcon className="size-3.5" />
            </TooltipTrigger>
            <TooltipPopup>{addLabel}</TooltipPopup>
          </Tooltip>
          {hasPrimaryKey && (
            <DeleteTableRowsDialog
              connectionId={connectionId}
              object={object}
              rowKeys={selectedRowKeys}
              newRowsCount={selectedNewRowsCount}
              onNewRowsRemove={onNewRowsRemove}
              onDeleted={onRowsDeleted}
            />
          )}
        </div>
      )}
      {canChangeRows && changesCount > 0 && (
        <div className="flex items-center gap-1">
          <Button size="xs" loading={isSaving} onClick={onSave}>
            {t('Save ({{count, number}})', { count: changesCount })}
          </Button>
          <Button variant="ghost" size="xs" disabled={isSaving} onClick={onUndo}>
            {t('Undo')}
          </Button>
        </div>
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
