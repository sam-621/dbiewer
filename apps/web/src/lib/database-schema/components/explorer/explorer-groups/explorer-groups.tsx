import { useTranslation } from 'react-i18next';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerFunction } from '../explorer-function/explorer-function';
import { ExplorerGroup } from '../explorer-group/explorer-group';
import type { OpenExplorerObject } from '../explorer-object';
import { ExplorerRelation } from '../explorer-relation/explorer-relation';

type Props = {
  schema: DbSchemaNode;
  isSearching: boolean;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerGroups = ({ schema, isSearching, onOpenObject }: Props) => {
  const { t } = useTranslation();

  return (
    <>
      {schema.tables.length > 0 && (
        <ExplorerGroup label={t('Tables')} count={schema.tables.length} isSearching={isSearching}>
          {schema.tables.map(table => (
            <ExplorerRelation
              key={table.name}
              kind="table"
              schemaName={schema.name}
              relation={table}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
      {schema.views.length > 0 && (
        <ExplorerGroup label={t('Views')} count={schema.views.length} isSearching={isSearching}>
          {schema.views.map(view => (
            <ExplorerRelation
              key={view.name}
              kind="view"
              schemaName={schema.name}
              relation={view}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
      {schema.functions.length > 0 && (
        <ExplorerGroup
          label={t('Functions')}
          count={schema.functions.length}
          isSearching={isSearching}
        >
          {schema.functions.map(fn => (
            <ExplorerFunction
              key={`${fn.name}(${fn.arguments})`}
              schemaName={schema.name}
              fn={fn}
              onOpenObject={onOpenObject}
            />
          ))}
        </ExplorerGroup>
      )}
    </>
  );
};
