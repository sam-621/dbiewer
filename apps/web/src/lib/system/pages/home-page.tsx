import { useTranslation } from 'react-i18next';

import { useGetHealth } from '../hooks/use-get-health';

export const HomePage = () => {
  const { t } = useTranslation();
  const { isLoading, isHealthy } = useGetHealth();

  const status = isLoading
    ? t('Checking API')
    : isHealthy
      ? t('API connected')
      : t('API unavailable');

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-3xl font-semibold">dbiewer</h1>
      <p className="text-muted-foreground">{t('SQL client in the browser')}</p>
      <p role="status" className="text-sm">
        {status}
      </p>
    </main>
  );
};
