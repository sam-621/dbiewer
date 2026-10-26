import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useSignInMagicLink } from '../../hooks/use-sign-in-magic-link';

export const useLoginForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasLinkError, setHasLinkError] = useState(() => searchParams.has('error'));
  const { signInMagicLink, isLoading } = useSignInMagicLink();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { email: '' }
  });

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

  const onSubmit = async ({ email }: FormValues) => {
    const result = await signInMagicLink(email);

    if (!result.isSuccess) form.setError('root', { message: result.error });
  };

  const backToForm = () => {
    setHasLinkError(false);
    form.reset();
  };

  return { form, isLoading, hasLinkError, onSubmit: form.handleSubmit(onSubmit), backToForm };
};

const Schema = z.object({
  email: z.email('Enter a valid email')
});

type FormValues = z.infer<typeof Schema>;
