import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EyeIcon, EyeSlashIcon } from '@/shared/components/icons/icons';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { DialogClose, DialogFooter, DialogPanel } from '@/shared/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';

import { useConnectionForm } from './use-connection-form';

type Props = { onSuccess: () => void };

export const ConnectionForm = ({ onSuccess }: Props) => {
  const { t } = useTranslation();
  const { form, isLoading, onUrlChange, onSubmit } = useConnectionForm({ onSuccess });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    register,
    control,
    formState: { errors }
  } = form;

  const sslModes = [
    { value: 'DISABLE', label: t('Disable') },
    { value: 'REQUIRE', label: t('Require') },
    { value: 'VERIFY_FULL', label: t('Verify full') }
  ];

  return (
    <Form className="flex min-h-0 flex-col" onSubmit={onSubmit}>
      <DialogPanel className="flex flex-col gap-4">
        {errors.root?.message && (
          <Alert variant="error">
            <AlertDescription>{t(errors.root.message)}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field invalid={!!errors.name}>
            <FieldLabel>{t('Name')}</FieldLabel>
            <Input autoComplete="off" placeholder={t('Acme prod')} {...register('name')} />
            <FieldError match={!!errors.name}>
              {errors.name?.message && t(errors.name.message)}
            </FieldError>
          </Field>
          <Controller
            control={control}
            name="sslMode"
            render={({ field }) => (
              <Field>
                <FieldLabel>{t('SSL')}</FieldLabel>
                <Select items={sslModes} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {sslModes.map(sslMode => (
                      <SelectItem key={sslMode.value} value={sslMode.value}>
                        {sslMode.label}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            )}
          />
        </div>
        <Field invalid={!!errors.url}>
          <FieldLabel>{t('Connection URL')}</FieldLabel>
          <Input
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            placeholder="postgres://ana:secret@db.acme.dev:5432/acme_prod?sslmode=require"
            {...register('url', { onChange: event => onUrlChange(event.target.value) })}
          />
          <FieldDescription>{t('Paste a connection URL to fill in the fields.')}</FieldDescription>
          <FieldError match={!!errors.url}>
            {errors.url?.message && t(errors.url.message)}
          </FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field invalid={!!errors.host}>
            <FieldLabel>{t('Host')}</FieldLabel>
            <Input
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              placeholder="db.acme.dev"
              {...register('host')}
            />
            <FieldError match={!!errors.host}>
              {errors.host?.message && t(errors.host.message)}
            </FieldError>
          </Field>
          <Field invalid={!!errors.port}>
            <FieldLabel>{t('Port')}</FieldLabel>
            <Input
              inputMode="numeric"
              autoComplete="off"
              className="font-mono"
              placeholder="5432"
              {...register('port')}
            />
            <FieldError match={!!errors.port}>
              {errors.port?.message && t(errors.port.message)}
            </FieldError>
          </Field>
        </div>
        <Field invalid={!!errors.database}>
          <FieldLabel>{t('Database')}</FieldLabel>
          <Input
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            placeholder="acme_prod"
            {...register('database')}
          />
          <FieldError match={!!errors.database}>
            {errors.database?.message && t(errors.database.message)}
          </FieldError>
        </Field>
        <Field invalid={!!errors.username}>
          <FieldLabel>{t('User')}</FieldLabel>
          <Input
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            placeholder="ana"
            {...register('username')}
          />
          <FieldError match={!!errors.username}>
            {errors.username?.message && t(errors.username.message)}
          </FieldError>
        </Field>
        <Field>
          <FieldLabel>{t('Password')}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              className="font-mono"
              {...register('password')}
            />
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={isPasswordVisible ? t('Hide password') : t('Show password')}
                onClick={() => setIsPasswordVisible(isVisible => !isVisible)}
              >
                {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{t('Cancel')}</DialogClose>
        <Button type="submit" loading={isLoading}>
          {t('Save connection')}
        </Button>
      </DialogFooter>
    </Form>
  );
};
