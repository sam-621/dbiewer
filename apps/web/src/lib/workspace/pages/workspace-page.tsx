import { useTranslation } from 'react-i18next';

import { ConnectionsDevList } from '@/lib/connection/components/connections-dev-list/connections-dev-list';
import { ConnectionsEmpty } from '@/lib/connection/components/connections-empty/connections-empty';
import { useGetConnections } from '@/lib/connection/hooks/use-get-connections';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/shared/components/ui/empty';
import { Spinner } from '@/shared/components/ui/spinner';

import { WorkspaceLayout } from '../components/workspace-layout/workspace-layout';

export const WorkspacePage = () => {
  const { t } = useTranslation();
  const { connections, isLoading, isError, isFetching, refetch } = useGetConnections();

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </main>
    );
  }

  if (isError) {
    return (
      <WorkspaceLayout>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>
              <h1>{t("We couldn't load your connections")}</h1>
            </EmptyTitle>
            <EmptyDescription>{t('Something went wrong')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" loading={isFetching} onClick={() => refetch()}>
              {t('Try again')}
            </Button>
          </EmptyContent>
        </Empty>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      {connections.length ? <ConnectionsDevList connections={connections} /> : <ConnectionsEmpty />}
    </WorkspaceLayout>
  );
};
