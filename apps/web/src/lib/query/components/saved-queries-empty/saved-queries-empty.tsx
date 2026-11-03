import { useTranslation } from 'react-i18next';

import { FileIcon } from '@/shared/components/icons/icons';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/shared/components/ui/empty';

export const SavedQueriesEmpty = () => {
  const { t } = useTranslation();

  return (
    <Empty className="px-2 py-8 md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>{t('No saved queries')}</EmptyTitle>
        <EmptyDescription>
          {t('The queries you save on this connection show up here.')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
