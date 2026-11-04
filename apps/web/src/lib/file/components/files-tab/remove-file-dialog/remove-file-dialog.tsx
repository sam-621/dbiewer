import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
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

import { useRemoveFile } from '../../../hooks/use-remove-file';
import { getFileName } from '../../../utils/file.utils';

type Props = {
  file: CommonFileFragment;
  onClose: () => void;
  onRemoved: () => void;
};

export const RemoveFileDialog = ({ file, onClose, onRemoved }: Props) => {
  const { t } = useTranslation();
  const { removeFile, isLoading } = useRemoveFile();
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    const result = await removeFile(file.id);

    if (result.isSuccess) return onRemoved();
    setError(result.error);
  };

  return (
    <AlertDialog open onOpenChange={isOpen => !isOpen && onClose()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Delete {{name}}?', { name: getFileName(file) })}</AlertDialogTitle>
          <AlertDialogDescription>{t('This action cannot be undone.')}</AlertDialogDescription>
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
