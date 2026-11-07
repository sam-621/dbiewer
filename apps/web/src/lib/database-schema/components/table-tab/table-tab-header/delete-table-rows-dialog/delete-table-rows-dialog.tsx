import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MinusIcon } from '@/shared/components/icons/icons';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

import {
  type DeleteTableRowsResult,
  useDeleteTableRows
} from '../../../../hooks/use-delete-table-rows';
import type { TableRowKey } from '../../../../utils/table-view.utils';
import type { TableTabObject } from '../../table-tab';

type Props = {
  connectionId: string;
  object: TableTabObject;
  rowKeys: TableRowKey[];
  newRowsCount: number;
  onNewRowsRemove: () => void;
  onDeleted: (rowKeys: TableRowKey[]) => void;
};

export const DeleteTableRowsDialog = ({
  connectionId,
  object,
  rowKeys,
  newRowsCount,
  onNewRowsRemove,
  onDeleted
}: Props) => {
  const { t } = useTranslation();
  const { deleteTableRows, isLoading } = useDeleteTableRows();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<Extract<DeleteTableRowsResult, { isSuccess: false }> | null>(
    null
  );

  const open = () => {
    if (newRowsCount) onNewRowsRemove();
    if (!rowKeys.length) return;

    setError(null);
    setIsOpen(true);
  };

  const remove = async () => {
    const result = await deleteTableRows({
      connectionId,
      schema: object.schema,
      name: object.name,
      keys: rowKeys
    });

    if (!result.isSuccess) return setError(result);

    setIsOpen(false);
    onDeleted(rowKeys);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              aria-label={t('Delete selected rows')}
              disabled={!rowKeys.length && !newRowsCount}
              onClick={open}
            />
          }
        >
          <MinusIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipPopup>{t('Delete selected rows')}</TooltipPopup>
      </Tooltip>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('Delete {{count, number}} rows from {{name}}?', {
                count: rowKeys.length,
                name: object.name
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('This action cannot be undone.')}</AlertDialogDescription>
            {error && (
              <Alert variant="error">
                <AlertDescription>
                  <p>{t(error.error)}</p>
                  {error.errorCode === 'QUERY_FAILED' && error.detail && (
                    <p className="font-mono text-xs">{error.detail}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>{t('Cancel')}</AlertDialogClose>
            <Button variant="destructive" loading={isLoading} onClick={() => void remove()}>
              {t('Delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
};
