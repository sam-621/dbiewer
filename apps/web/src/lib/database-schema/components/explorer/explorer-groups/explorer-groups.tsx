import { useTranslation } from 'react-i18next';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerFunction } from '../explorer-function/explorer-function';
import { ExplorerGroup } from '../explorer-group/explorer-group';
import type { ChangeExplorerExpanded, OpenExplorerObject } from '../explorer-object';
import { ExplorerTable } from '../explorer-table/explorer-table';
import { ExplorerView } from '../explorer-view/explorer-view';

type Props = {
  schema: DbSchemaNode;
  isSearching: boolean;
  expandedIds: string[];
  onExpandedChange: ChangeExplorerExpanded;
  activeTabKey?: string | null;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerGroups = ({
  schema,
  isSearching,
  expandedIds,
  onExpandedChange,
  activeTabKey,
  onOpenObject
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      {schema.tables.length > 0 && (
        <ExplorerGroup
          id={`group:${schema.name}.tables`}
          label={t('Tables')}
          count={schema.tables.length}
          isSearching={isSearching}
          expandedIds={expandedIds}
          onExpandedChange={onExpandedChange}
        >
          {schema.tables.map(table => (
            <ExplorerTable
              key={table.name}
              schemaName={schema.name}
              table={table}
              expandedIds={expandedIds}
              onExpandedChange={onExpandedChange}
              activeTabKey={activeTabKey}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
      {schema.views.length > 0 && (
        <ExplorerGroup
          id={`group:${schema.name}.views`}
          label={t('Views')}
          count={schema.views.length}
          isSearching={isSearching}
          expandedIds={expandedIds}
          onExpandedChange={onExpandedChange}
        >
          {schema.views.map(view => (
            <ExplorerView
              key={view.name}
              schemaName={schema.name}
              view={view}
              expandedIds={expandedIds}
              onExpandedChange={onExpandedChange}
              activeTabKey={activeTabKey}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
      {schema.functions.length > 0 && (
        <ExplorerGroup
          id={`group:${schema.name}.functions`}
          label={t('Functions')}
          count={schema.functions.length}
          isSearching={isSearching}
          expandedIds={expandedIds}
          onExpandedChange={onExpandedChange}
        >
          {schema.functions.map(fn => (
            <ExplorerFunction
              key={`${fn.name}(${fn.arguments})`}
              schemaName={schema.name}
              fn={fn}
              activeTabKey={activeTabKey}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
    </>
  );
};
