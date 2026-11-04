import { useTranslation } from 'react-i18next';

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

type Props = {
  name: string;
  onCancel: () => void;
  onDiscard: () => void;
};

export const CloseTabDialog = ({ name, onCancel, onDiscard }: Props) => {
  const { t } = useTranslation();

  return (
    <AlertDialog open onOpenChange={isOpen => !isOpen && onCancel()}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Discard changes?')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('The unsaved changes in {{name}} will be lost.', { name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" />}>{t('Cancel')}</AlertDialogClose>
          <Button variant="destructive" onClick={onDiscard}>
            {t('Discard')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
};
