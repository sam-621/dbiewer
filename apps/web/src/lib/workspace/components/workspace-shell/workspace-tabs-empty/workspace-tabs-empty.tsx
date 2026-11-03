import { useTranslation } from 'react-i18next';

import { PlusIcon, TableIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia
} from '@/shared/components/ui/empty';

import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';

export const WorkspaceTabsEmpty = () => {
  const { t } = useTranslation();
  const { openDraft } = useWorkspaceTabs();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TableIcon />
        </EmptyMedia>
        <EmptyDescription>{t('Open a table from the explorer to see its data.')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={openDraft}>
          <PlusIcon />
          {t('New query')}
        </Button>
      </EmptyContent>
    </Empty>
  );
};
