import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

import { useSignInMagicLink } from '../../hooks/use-sign-in-magic-link';

import { type FormValues, useLoginForm } from './use-form/use-form';

type Props = {
  onSent: (email: string) => void;
};

export const LoginForm = ({ onSent }: Props) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { signInMagicLink, isLoading } = useSignInMagicLink();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useLoginForm();

  const hasLinkError = searchParams.has('error');

  const onSubmit = async ({ email }: FormValues) => {
    setSubmitError(null);
    const result = await signInMagicLink(email);

    if (result.isSuccess) return onSent(email);

    setSubmitError(result.error);
  };

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
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
