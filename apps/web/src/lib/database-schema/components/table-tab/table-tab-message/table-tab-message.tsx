import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/shared/components/ui/empty';

import type { TableQueryError } from '../../../utils/table-view.utils';

type Props = {
  error: TableQueryError | null;
  isRetrying: boolean;
  onRetry: () => void;
};

export const TableTabMessage = ({ error, isRetrying, onRetry }: Props) => {
  const { t } = useTranslation();

  if (error?.errorCode === 'OBJECT_NOT_FOUND') {
    return (
      <Empty className="md:py-12">
        <EmptyHeader>
          <EmptyTitle>{t('This object no longer exists')}</EmptyTitle>
          <EmptyDescription>
            {t('It may have been renamed or dropped from the database.')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty className="md:py-12">
      <EmptyHeader>
        <EmptyTitle>{t(error?.error ?? 'Something went wrong')}</EmptyTitle>
        {error?.errorCode === 'QUERY_FAILED' && error.detail && (
          <EmptyDescription className="font-mono text-xs">{error.detail}</EmptyDescription>
        )}
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" loading={isRetrying} onClick={onRetry}>
          {t('Try again')}
        </Button>
      </EmptyContent>
    </Empty>
  );
};
