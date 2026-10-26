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
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';

import { useRemoveConnection } from '../../../hooks/use-remove-connection';

type Props = { connection: CommonConnectionFragment };

export const ConnectionRow = ({ connection }: Props) => {
  const { t } = useTranslation();
  const { removeConnection, isLoading } = useRemoveConnection();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { name, username, host, port, database } = connection;

  const onRemove = async () => {
    setIsDialogOpen(false);
    setError(null);

    const result = await removeConnection(connection.id);
    if (!result.isSuccess) setError(result.error);
  };

  return (
    <li
      className="flex flex-col gap-2 px-4 py-3 aria-disabled:opacity-64"
      aria-disabled={isLoading || undefined}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {`${username}@${host}:${port}/${database}`}
          </span>
        </div>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive-outline"
                size="sm"
                loading={isLoading}
                aria-label={t('Remove {{name}}', { name })}
              />
            }
          >
            {t('Remove')}
          </AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('Remove connection?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('{{name}} will be permanently deleted.', { name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" />}>
                {t('Cancel')}
              </AlertDialogClose>
              <Button variant="destructive" onClick={onRemove}>
                {t('Remove')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      </div>
      {error && (
        <Alert variant="error">
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
      )}
    </li>
  );
};
