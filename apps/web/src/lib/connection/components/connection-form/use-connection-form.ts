import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useCreateConnection } from '../../hooks/use-create-connection';
import { type ConnectionUrlSslMode, parseConnectionUrl } from '../../utils/connection-url.utils';

type Params = { onSuccess: () => void };

export const useConnectionForm = ({ onSuccess }: Params) => {
  const { createConnection, isLoading } = useCreateConnection();

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      url: '',
      name: '',
      host: '',
      port: '5432',
      database: '',
      username: '',
      password: '',
      sslMode: 'REQUIRE'
    }
  });

  const onUrlChange = (url: string) => {
    if (!url.trim()) return form.clearErrors('url');

    const parsed = parseConnectionUrl(url);
    if (!parsed) return form.setError('url', { message: 'Enter a valid connection URL' });

    form.clearErrors('url');
    const options = { shouldValidate: form.formState.isSubmitted };
    const { username, password, host, port, database, sslMode } = parsed;

    form.setValue('host', host, options);
    if (port !== undefined) form.setValue('port', String(port), options);
    if (database !== undefined) form.setValue('database', database, options);
    if (username !== undefined) form.setValue('username', username, options);
    if (password !== undefined) form.setValue('password', password, options);
    if (sslMode) form.setValue('sslMode', SSL_MODES[sslMode]);
  };

  const onValid = async ({ url: _url, port, password, ...values }: FormValues) => {
    const result = await createConnection({
      ...values,
      port: Number(port),
      password: password || null
    });

    if (result.isSuccess) return onSuccess();

    if (result.errorCode === 'CONNECTION_NAME_ALREADY_EXISTS') {
      return form.setError('name', { message: result.error });
    }

    form.setError('root', { message: result.error });
  };

  return { form, isLoading, onUrlChange, onSubmit: form.handleSubmit(onValid) };
};

const SSL_MODES: Record<ConnectionUrlSslMode, FormValues['sslMode']> = {
  disable: 'DISABLE',
  require: 'REQUIRE',
  'verify-full': 'VERIFY_FULL'
};

const MIN_PORT = 1;
const MAX_PORT = 65535;

const Schema = z.object({
  url: z
    .string()
    .refine(url => !url.trim() || !!parseConnectionUrl(url), 'Enter a valid connection URL'),
  name: z.string().trim().min(1, 'Enter a name').max(50, 'Name must be 50 characters or less'),
  host: z.string().trim().min(1, 'Enter the host'),
  port: z
    .string()
    .trim()
    .refine(port => {
      const value = Number(port);
      return /^\d+$/.test(port) && value >= MIN_PORT && value <= MAX_PORT;
    }, 'Port must be between 1 and 65535'),
  database: z.string().trim().min(1, 'Enter the database'),
  username: z.string().trim().min(1, 'Enter the user'),
  password: z.string(),
  sslMode: z.enum(['DISABLE', 'REQUIRE', 'VERIFY_FULL'])
});

type FormValues = z.infer<typeof Schema>;
