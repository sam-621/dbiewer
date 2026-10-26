import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

import { useLoginForm } from './use-login-form';

type Props = {
  onSent: (email: string) => void;
};

export const LoginForm = ({ onSent }: Props) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasLinkError] = useState(() => searchParams.has('error'));
  const { form, isLoading, submitError, onSubmit } = useLoginForm({ onSent });
  const {
    register,
    formState: { errors }
  } = form;

  useEffect(() => {
    if (!hasLinkError) return;

    setSearchParams(
      params => {
        params.delete('error');
        return params;
      },
      { replace: true }
    );
  }, [hasLinkError, setSearchParams]);

  return (
    <div className="flex flex-col gap-4">
      {hasLinkError && (
        <Alert variant="warning">
          <AlertDescription>{t('This link expired. Request a new one.')}</AlertDescription>
        </Alert>
      )}
      {submitError && (
        <Alert variant="error">
          <AlertDescription>{t(submitError)}</AlertDescription>
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
  );
};
