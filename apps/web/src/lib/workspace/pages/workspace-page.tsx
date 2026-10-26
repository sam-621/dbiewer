import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetMe } from '@/lib/account/hooks/use-get-me';
import { useSignOut } from '@/lib/account/hooks/use-sign-out';
import { Brand } from '@/shared/components/brand';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';

export const WorkspacePage = () => {
  const { t } = useTranslation();
  const { me } = useGetMe();
  const { signOut, isLoading } = useSignOut();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const onSignOut = async () => {
    setSignOutError(null);
    const result = await signOut();

    if (!result.isSuccess) setSignOutError(result.error);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <Brand />
      {me?.workspace && <h1 className="text-xl font-semibold">{me.workspace.name}</h1>}
      {signOutError && (
        <Alert variant="error">
          <AlertDescription>{t(signOutError)}</AlertDescription>
        </Alert>
      )}
      <Button variant="outline" loading={isLoading} onClick={onSignOut}>
        {t('Sign out')}
      </Button>
    </main>
  );
};
