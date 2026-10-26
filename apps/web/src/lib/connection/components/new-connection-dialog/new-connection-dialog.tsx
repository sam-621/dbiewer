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

export const NewConnectionDialog = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button />}>{t('New connection')}</DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PostgresIcon className="size-5 shrink-0" />
            <span>{t('PostgreSQL')}</span>
          </div>
          <DialogTitle>{t('New connection')}</DialogTitle>
        </DialogHeader>
        <ConnectionForm onSuccess={() => setIsOpen(false)} />
      </DialogPopup>
    </Dialog>
  );
};
