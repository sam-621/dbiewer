import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SessionUser } from '@/lib/account/components/session-user/session-user';
import { useGetMe } from '@/lib/account/hooks/use-get-me';
import { ConnectionsEmpty } from '@/lib/connection/components/connections-empty/connections-empty';
import { useGetConnections } from '@/lib/connection/hooks/use-get-connections';
import { Brand } from '@/shared/components/brand';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle
} from '@/shared/components/ui/empty';
import { Spinner } from '@/shared/components/ui/spinner';

export const WorkspacePage = () => {
  const { t } = useTranslation();
  const { me } = useGetMe();
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

  if (!connections.length) {
    return (
      <WorkspaceLayout>
        <ConnectionsEmpty />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Brand />
        {me?.workspace && <h1 className="text-xl font-semibold">{me.workspace.name}</h1>}
      </div>
    </WorkspaceLayout>
  );
};

const WorkspaceLayout = ({ children }: { children: ReactNode }) => (
  <main className="flex min-h-svh flex-col">
    <header className="flex justify-end p-4">
      <SessionUser />
    </header>
    {children}
  </main>
);
