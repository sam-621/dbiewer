import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

import { LoginLinkSent } from './link-sent/login-link-sent';
import { useLoginForm } from './use-login-form';

export const LoginForm = () => {
  const { t } = useTranslation();
  const { form, isLoading, hasLinkError, onSubmit, backToForm } = useLoginForm();
  const {
    register,
    getValues,
    formState: { errors, isSubmitSuccessful }
  } = form;

  if (isSubmitSuccessful) {
    return <LoginLinkSent email={getValues('email')} onUseAnotherEmail={backToForm} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{t('Sign in to dbiewer')}</h1>
      <div className="flex flex-col gap-4">
        {hasLinkError && (
          <Alert variant="warning">
            <AlertDescription>{t('This link expired. Request a new one.')}</AlertDescription>
          </Alert>
        )}
        {errors.root?.message && (
          <Alert variant="error">
            <AlertDescription>{t(errors.root.message)}</AlertDescription>
          </Alert>
        )}
        <Form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <Field invalid={!!errors.email}>
            <FieldLabel>{t('Email')}</FieldLabel>
            <Input
              inputMode="email"
              autoComplete="email"
              placeholder={t('ana@acme.dev')}
              {...register('email')}
            />
            <FieldError match={!!errors.email}>
              {errors.email?.message && t(errors.email.message)}
            </FieldError>
          </Field>
          <Button type="submit" loading={isLoading} className="w-full">
            {t('Send magic link')}
          </Button>
        </Form>
      </div>
    </div>
  );
};
