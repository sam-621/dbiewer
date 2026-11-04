import { useTranslation } from 'react-i18next';

import { SqlTab } from '@/lib/query/components/sql-tab/sql-tab';
import type { DraftTab, FileTab } from '@/lib/workspace/utils/workspace-tabs.utils';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/shared/components/ui/empty';
import { Skeleton } from '@/shared/components/ui/skeleton';

import { useGetFile } from '../../hooks/use-get-file';
import { TextTab } from '../text-tab/text-tab';

type Props = {
  connectionId: string;
  connectionName: string;
  tab: DraftTab | FileTab;
};

export const FileEditorTab = ({ connectionId, connectionName, tab }: Props) => {
  const { t } = useTranslation();
  const fileId = tab.kind === 'file' ? tab.fileId : null;
  const { file, isLoading, isError, isFetching, refetch } = useGetFile(fileId);

  if (isLoading) {
    return (
      <div role="status" aria-label={t('Loading file')} className="flex flex-col gap-2 p-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-6" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="md:py-12">
        <EmptyHeader>
          <EmptyTitle>{t("We couldn't load this file")}</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" size="sm" loading={isFetching} onClick={() => refetch()}>
            {t('Try again')}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (fileId && !file) {
    return (
      <Empty className="md:py-12">
        <EmptyHeader>
          <EmptyTitle>{t('This file no longer exists')}</EmptyTitle>
          <EmptyDescription>{t('It may have been deleted.')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (tab.type === 'txt') {
    return <TextTab connectionId={connectionId} tabKey={tab.key} file={file} />;
  }

  return (
    <SqlTab
      connectionId={connectionId}
      connectionName={connectionName}
      tabKey={tab.key}
      file={file}
    />
  );
};
