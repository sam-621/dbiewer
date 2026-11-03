import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LogOutIcon } from '@/shared/components/icons/icons';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { MenuItem } from '@/shared/components/ui/menu';

import { useSignOut } from '../../../hooks/use-sign-out';

const MENU_ITEM =
  'h-8 w-full justify-between gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-[background-color,color] duration-150 sm:min-h-8 data-highlighted:text-destructive-foreground [&>svg]:mx-0';

const MENU_ICON = 'ms-auto size-4 opacity-100';

export const SignOutItem = () => {
  const { t } = useTranslation();
  const { signOut, isLoading } = useSignOut();
  const [error, setError] = useState<string | null>(null);

  const onSignOut = async () => {
    setError(null);
    const result = await signOut();

    if (!result.isSuccess) setError(result.error);
  };

  return (
    <>
      <MenuItem
        variant="destructive"
        className={MENU_ITEM}
        closeOnClick={false}
        disabled={isLoading}
        onClick={() => void onSignOut()}
      >
        {t('Sign out')}
        <LogOutIcon className={MENU_ICON} />
      </MenuItem>
      {error && (
        <Alert variant="error" className="mt-1">
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
      )}
    </>
  );
};
