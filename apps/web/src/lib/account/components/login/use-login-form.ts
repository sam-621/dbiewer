import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useSignInMagicLink } from '../../hooks/use-sign-in-magic-link';

type Params = {
  onSent: (email: string) => void;
};

export const useLoginForm = ({ onSent }: Params) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { signInMagicLink, isLoading } = useSignInMagicLink();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' }
  });

  const onSubmit = async ({ email }: FormValues) => {
    setSubmitError(null);
    const result = await signInMagicLink(email);

    if (result.isSuccess) return onSent(email);

    setSubmitError(result.error);
  };

  return { form, isLoading, submitError, onSubmit: form.handleSubmit(onSubmit) };
};

const Schema = z.object({
  email: z.email('Enter a valid email')
});

type FormValues = z.infer<typeof Schema>;
