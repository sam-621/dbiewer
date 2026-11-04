import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { DialogClose, DialogFooter, DialogPanel } from '@/shared/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';

import { FILE_EXTENSIONS } from '../../constants/file-types';

import { type FileNameTarget, useFileNameForm } from './use-file-name-form';

type Props = {
  connectionId: string;
  file: FileNameTarget;
  getContent: () => string;
  onSuccess: (file: CommonFileFragment) => void;
};

export const FileNameForm = ({ connectionId, file, getContent, onSuccess }: Props) => {
  const { t } = useTranslation();
  const { form, isLoading, onSubmit } = useFileNameForm({
    connectionId,
    file,
    getContent,
    onSuccess
  });
  const {
    register,
    formState: { errors }
  } = form;

  return (
    <Form className="flex min-h-0 flex-col" onSubmit={onSubmit}>
      <DialogPanel className="flex flex-col gap-4">
        {errors.root?.message && (
          <Alert variant="error">
            <AlertDescription>{t(errors.root.message)}</AlertDescription>
          </Alert>
        )}
        <Field invalid={!!errors.name}>
          <FieldLabel>{t('Name')}</FieldLabel>
          <InputGroup>
            <InputGroupInput autoComplete="off" spellCheck={false} {...register('name')} />
            <InputGroupAddon align="inline-end">.{FILE_EXTENSIONS[file.type]}</InputGroupAddon>
          </InputGroup>
          <FieldError match={!!errors.name}>
            {errors.name?.message && t(errors.name.message)}
          </FieldError>
        </Field>
      </DialogPanel>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>{t('Cancel')}</DialogClose>
        <Button type="submit" loading={isLoading}>
          {t('Save')}
        </Button>
      </DialogFooter>
    </Form>
  );
};
