import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import { SidebarMenu, SidebarMenuSkeleton } from '@/shared/components/ui/sidebar';

import { useGetConnectionSchema } from '../../hooks/use-get-connection-schema';
import { filterSchemas } from '../../utils/database-schema.utils';

import { ExplorerGroups } from './explorer-groups/explorer-groups';
import type { OpenExplorerObject } from './explorer-object';
import { ExplorerSchema } from './explorer-schema/explorer-schema';

type Props = {
  connectionId: string;
  search: string;
  onOpenObject?: OpenExplorerObject;
};

export const Explorer = ({ connectionId, search, onOpenObject }: Props) => {
  const { t } = useTranslation();
  const { schemas, schemaError, isLoading, isFetching, refetch } =
    useGetConnectionSchema(connectionId);

  if (isLoading) {
    return (
      <div role="status" aria-label={t('Loading schema')} className="flex flex-col gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <SidebarMenuSkeleton key={index} className="h-7" />
        ))}
      </div>
    );
  }

  if (schemaError) {
    return (
      <ExplorerMessage>
        <p>{t(schemaError)}</p>
        <Button variant="outline" size="sm" loading={isFetching} onClick={() => refetch()}>
          {t('Try again')}
        </Button>
      </ExplorerMessage>
    );
  }

  if (!schemas.length) {
    return (
      <ExplorerMessage>
        <p>{t('This database has no tables, views or functions')}</p>
      </ExplorerMessage>
    );
  }

  const query = search.trim();
  const visibleSchemas = filterSchemas(schemas, query);

  if (!visibleSchemas.length) {
    return (
      <ExplorerMessage>
        <p>{t('No results for “{{search}}”', { search: query })}</p>
      </ExplorerMessage>
    );
  }

  const isSearching = query.length > 0;

  return (
    <SidebarMenu className="gap-0">
      {visibleSchemas.map(schema =>
        schemas.length > 1 ? (
          <ExplorerSchema
            key={schema.name}
            schema={schema}
            isSearching={isSearching}
            onOpenObject={onOpenObject}
          />
        ) : (
          <ExplorerGroups
            key={schema.name}
            schema={schema}
            isSearching={isSearching}
            onOpenObject={onOpenObject}
          />
        )
      )}
    </SidebarMenu>
  );
};

const ExplorerMessage = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-start gap-3 px-2 py-1 text-sm text-muted-foreground">
    {children}
  </div>
);
