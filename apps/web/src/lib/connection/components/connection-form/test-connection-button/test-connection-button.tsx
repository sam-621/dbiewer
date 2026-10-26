import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { CheckCircleIcon, XCircleIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

import type { FormValues } from '../use-connection-form';

import { useTestConnectionButton } from './use-test-connection-button';

type Props = { form: UseFormReturn<FormValues> };

export const TestConnectionButton = ({ form }: Props) => {
  const { t } = useTranslation();
  const { status, canTest, isLoading, onTest } = useTestConnectionButton(form);

  return (
    <Button
      variant="outline"
      className={cn(
        'sm:me-auto',
        status === 'success' &&
          'border-success/32 bg-success/8 text-success-foreground hover:bg-success/8 dark:bg-success/16 dark:hover:bg-success/16',
        status === 'error' &&
          'border-destructive/32 bg-destructive/8 text-destructive-foreground hover:bg-destructive/8 dark:bg-destructive/16 dark:hover:bg-destructive/16'
      )}
      disabled={!canTest}
      loading={isLoading}
      onClick={onTest}
    >
      {status === 'success' && <CheckCircleIcon />}
      {status === 'error' && <XCircleIcon />}
      {status === 'idle' && t('Test connection')}
      {status === 'success' && t('Connected')}
      {status === 'error' && t('Connection failed')}
    </Button>
  );
};
