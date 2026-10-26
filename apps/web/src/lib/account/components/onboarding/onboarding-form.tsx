import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

import { LanguagePicker } from './language-picker/language-picker';
import { ThemePicker } from './theme-picker/theme-picker';
import { useOnboardingForm } from './use-onboarding-form';

export const OnboardingForm = () => {
  const { t } = useTranslation();
  const { form, isLoading, onSubmit } = useOnboardingForm();
  const {
    register,
    formState: { errors }
  } = form;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold">{t('Welcome to dbiewer')}</h1>
      <div className="flex flex-col gap-4">
        {errors.root?.message && (
          <Alert variant="error">
            <AlertDescription>{t(errors.root.message)}</AlertDescription>
          </Alert>
        )}
        <Form className="flex flex-col gap-6" onSubmit={onSubmit}>
          <Field invalid={!!errors.name}>
            <FieldLabel>{t('What should we call you?')}</FieldLabel>
            <Input autoComplete="name" placeholder={t('Ana')} {...register('name')} />
            <FieldError match={!!errors.name}>
              {errors.name?.message && t(errors.name.message)}
            </FieldError>
          </Field>
          <LanguagePicker />
          <ThemePicker />
          <Button type="submit" loading={isLoading} className="self-start">
            {t('Continue')}
          </Button>
        </Form>
      </div>
    </div>
  );
};
