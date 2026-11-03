import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PostgresIcon } from '@/shared/components/icons/postgres-icon';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger
} from '@/shared/components/ui/dialog';

import { ConnectionForm } from '../connection-form/connection-form';

type Props = {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onCreated?: (connectionId: string) => void;
};

export const NewConnectionDialog = ({ isOpen, onOpenChange, onCreated }: Props) => {
  const { t } = useTranslation();
  const [isOpenState, setIsOpenState] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : isOpenState;

  const changeOpen = (nextIsOpen: boolean) => {
    if (!isControlled) setIsOpenState(nextIsOpen);
    onOpenChange?.(nextIsOpen);
  };

  const handleSuccess = (connectionId: string | null) => {
    changeOpen(false);
    if (connectionId) onCreated?.(connectionId);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {!isControlled && <DialogTrigger render={<Button />}>{t('New connection')}</DialogTrigger>}
      <DialogPopup>
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PostgresIcon className="size-5 shrink-0" />
            <span>{t('PostgreSQL')}</span>
          </div>
          <DialogTitle>{t('New connection')}</DialogTitle>
        </DialogHeader>
        <ConnectionForm onSuccess={handleSuccess} />
      </DialogPopup>
    </Dialog>
  );
};
