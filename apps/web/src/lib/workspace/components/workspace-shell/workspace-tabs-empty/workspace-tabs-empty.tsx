import { useTranslation } from 'react-i18next';

import { TableIcon } from '@/shared/components/icons/icons';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/shared/components/ui/empty';

export const WorkspaceTabsEmpty = () => {
  const { t } = useTranslation();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TableIcon />
        </EmptyMedia>
        <EmptyDescription>
          {t('Open a table from the explorer or a file from Files.')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
