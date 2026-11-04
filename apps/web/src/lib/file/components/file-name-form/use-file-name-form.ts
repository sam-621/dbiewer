import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type { CommonFileFragment, FileType } from '@/lib/api/types';

import { useSaveFile } from '../../hooks/use-save-file';

export type FileNameTarget = { id?: string; name: string; type: FileType };

type Params = {
  connectionId: string;
  file: FileNameTarget;
  getContent: () => string;
  onSuccess: (file: CommonFileFragment) => void;
};

export const useFileNameForm = ({ connectionId, file, getContent, onSuccess }: Params) => {
  const { saveFile, isLoading } = useSaveFile();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: file.name }
  });

  const onValid = async ({ name }: FormValues) => {
    const result = await saveFile({
      id: file.id,
      connectionId,
      name,
      type: file.type,
      content: getContent()
    });

    if (result.isSuccess) return onSuccess(result.file);

    if (result.errorCode === 'FILE_NAME_ALREADY_EXISTS' || result.errorCode === 'INVALID_INPUT') {
      return form.setError('name', { message: result.error });
    }

    form.setError('root', { message: result.error });
  };

  return { form, isLoading, onSubmit: form.handleSubmit(onValid) };
};

const Schema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(100, 'Name must be 100 characters or less')
});

type FormValues = z.infer<typeof Schema>;
