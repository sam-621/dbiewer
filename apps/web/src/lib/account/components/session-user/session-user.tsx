import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { UserAvatar } from '@/shared/components/user-avatar';

import { useGetMe } from '../../hooks/use-get-me';
import { useSignOut } from '../../hooks/use-sign-out';

export const SessionUser = () => {
  const { t } = useTranslation();
  const { me } = useGetMe();
  const { signOut, isLoading } = useSignOut();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const onSignOut = async () => {
    setSignOutError(null);
    const result = await signOut();

    if (!result.isSuccess) setSignOutError(result.error);
  };

  const user = me?.user;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <UserAvatar id={user?.id} image={user?.image} className="size-8" />
        <div className="flex min-w-0 flex-col text-left">
          {user?.name && <span className="truncate text-sm font-medium">{user.name}</span>}
          {user?.email && (
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          )}
        </div>
        <Button variant="outline" size="sm" loading={isLoading} onClick={onSignOut}>
          {t('Sign out')}
        </Button>
      </div>
      {signOutError && (
        <Alert variant="error">
          <AlertDescription>{t(signOutError)}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
