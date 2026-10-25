import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/shared/components/ui/button';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('Page not found')}</h1>
      <Button asChild variant="outline">
        <Link to="/">{t('Go home')}</Link>
      </Button>
    </main>
  );
};
