import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Brand } from '@/shared/components/brand';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/shared/components/ui/empty';

export const ConnectionsEmpty = () => {
  const { t } = useTranslation();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <Brand />
        </EmptyMedia>
        <EmptyTitle>
          <h1>{t('Connect your first database')}</h1>
        </EmptyTitle>
        <EmptyDescription>
          {t('You need a Postgres connection to explore its schema and run queries.')}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to="/connections/new" />}>{t('New connection')}</Button>
      </EmptyContent>
    </Empty>
  );
};
