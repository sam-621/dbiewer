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
  connection: CommonConnectionFragment;
  onClose: () => void;
};

export const RemoveConnectionDialog = ({ connection, onClose }: Props) => {
  const { t } = useTranslation();
  const { removeConnection, isLoading } = useRemoveConnection();
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    const result = await removeConnection(connection.id);

    if (result.isSuccess) return onClose();
    setError(result.error);
  };

  return (
    <AlertDialog open onOpenChange={isOpen => !isOpen && onClose()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Delete {{name}}?', { name: connection.name })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('Its saved files will be deleted too. This action cannot be undone.')}
          </AlertDialogDescription>
          {error && (
            <Alert variant="error">
              <AlertDescription>{t(error)}</AlertDescription>
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
  );
};
