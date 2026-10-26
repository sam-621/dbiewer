import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Brand } from '@/shared/components/brand';

import { LoginForm } from '../components/login/login-form';
import { LoginSent } from '../components/login/login-sent';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Brand />
        {sentTo ? (
          <LoginSent email={sentTo} onUseAnotherEmail={() => setSentTo(null)} />
        ) : (
          <div className="flex flex-col gap-6">
            <h1 className="font-heading text-2xl font-semibold">{t('Sign in to dbiewer')}</h1>
            <LoginForm onSent={setSentTo} />
          </div>
        )}
      </div>
    </main>
  );
};
