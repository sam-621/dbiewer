import { useTranslation } from 'react-i18next';

import { GithubIcon } from '@/shared/components/icons/github-icon';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';

import { useLoginForm } from './use-login-form';

export const LoginForm = () => {
  const { t } = useTranslation();
  const { isLoading, hasGithubError, error, onGithubSignIn } = useLoginForm();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{t('Sign in to dbiewer')}</h1>
      <div className="flex flex-col gap-4">
        {hasGithubError && !error && (
          <Alert variant="error">
            <AlertDescription>
              {t("We couldn't sign you in with GitHub. Try again.")}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="error">
            <AlertDescription>{t(error)}</AlertDescription>
          </Alert>
        )}
        <Button type="button" loading={isLoading} className="w-full" onClick={onGithubSignIn}>
          <GithubIcon />
          {t('Continue with GitHub')}
        </Button>
      </div>
    </div>
  );
};
