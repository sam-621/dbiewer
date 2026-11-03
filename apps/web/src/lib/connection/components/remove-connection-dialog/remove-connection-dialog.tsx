import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonConnectionFragment } from '@/lib/api/types';
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

import { useRemoveConnection } from '../../hooks/use-remove-connection';

type Props = {
  connection: Pick<CommonConnectionFragment, 'id' | 'name'> | null;
  onClose: () => void;
};

export const RemoveConnectionDialog = ({ connection, onClose }: Props) => {
  const { t } = useTranslation();
  const { removeConnection, isLoading } = useRemoveConnection();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setError(null);
    onClose();
  };

  const onRemove = async () => {
    if (!connection) return;
    setError(null);

    const result = await removeConnection(connection.id);
    if (!result.isSuccess) return setError(result.error);

    close();
  };

  return (
    <AlertDialog
      open={!!connection}
      onOpenChange={isOpen => {
        if (!isOpen) close();
      }}
    >
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Remove connection?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('{{name}} will be permanently deleted.', { name: connection?.name })}
          </AlertDialogDescription>
          {error && (
            <Alert variant="error">
              <AlertDescription>{t(error)}</AlertDescription>
            </Alert>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>{t('Cancel')}</AlertDialogClose>
          <Button variant="destructive" loading={isLoading} onClick={onRemove}>
            {t('Remove')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
