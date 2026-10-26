import { useEffect, useState } from 'react';
import { type UseFormReturn, useWatch } from 'react-hook-form';

import { useTestConnection } from '../../../hooks/use-test-connection';
import type { FormValues } from '../use-connection-form';

type Status = 'idle' | 'success' | 'error';

export const useTestConnectionButton = (form: UseFormReturn<FormValues>) => {
  const { testConnection, isLoading } = useTestConnection();
  const [status, setStatus] = useState<Status>('idle');
  const [host, port, database, username] = useWatch({
    control: form.control,
    name: ['host', 'port', 'database', 'username']
  });

  const canTest = [host, port, database, username].every(value => !!value.trim());

  useEffect(() => {
    if (status === 'idle') return;

    const timeout = setTimeout(() => setStatus('idle'), STATUS_DURATION);
    return () => clearTimeout(timeout);
  }, [status]);

  const onTest = async () => {
    const { port, password, ...values } = form.getValues();
    const result = await testConnection({
      host: values.host,
      port: Number(port),
      database: values.database,
      username: values.username,
      password: password || null,
      sslMode: values.sslMode
    });

    setStatus(result.isSuccess ? 'success' : 'error');
  };

  return { status, canTest, isLoading, onTest };
};

const STATUS_DURATION = 2000;
