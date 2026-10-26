import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';

import { useSignInMagicLink } from '../../../hooks/use-sign-in-magic-link';

type Props = {
  email: string;
  onUseAnotherEmail: () => void;
};

export const LoginLinkSent = ({ email, onUseAnotherEmail }: Props) => {
  const { t } = useTranslation();
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);
  const { signInMagicLink, isLoading } = useSignInMagicLink();

  const resend = async () => {
    setResendError(null);
    setIsResent(false);
    const result = await signInMagicLink(email);

    if (result.isSuccess) return setIsResent(true);

    setResendError(result.error);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">{t('Check your email')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('We sent a magic link to {{email}}. It expires in 15 minutes.', { email })}
        </p>
      </div>
      {resendError && (
        <Alert variant="error">
          <AlertDescription>{t(resendError)}</AlertDescription>
        </Alert>
      )}
      {isResent && (
        <Alert variant="success">
          <AlertDescription>{t('We sent you a new link.')}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Button variant="outline" loading={isLoading} onClick={resend}>
          {t('Resend link')}
        </Button>
        <Button variant="ghost" onClick={onUseAnotherEmail}>
          {t('Use another email')}
        </Button>
      </div>
    </div>
  );
};
