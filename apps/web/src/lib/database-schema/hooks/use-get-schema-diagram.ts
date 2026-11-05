import { useMemo } from 'react';

import { GET_SCHEMA_DIAGRAM_QUERY } from '@/lib/api/operations/database-schema.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';
import { formatColumnType } from '../utils/database-schema.utils';
import { getTableQueryError } from '../utils/table-view.utils';

export const useGetSchemaDiagram = (connectionId: string) => {
  const result = useGqlQuery(GET_SCHEMA_DIAGRAM_QUERY, {
    key: [DatabaseSchemaCacheKeys.SchemaDiagram],
    variables: { connectionId }
  });

  const [apiError] = result.data?.schemaDiagram.apiErrors ?? [];
  const data = result.data?.schemaDiagram.diagram;
  const diagramError = getTableQueryError(apiError, result.isError);

  const diagram = useMemo(
    () =>
      data
        ? {
            relations: data.relations,
            entities: data.entities.map(entity => ({
              ...entity,
              properties: entity.properties.map(property => ({
                ...property,
                type: formatColumnType(property.type)
              }))
            }))
          }
        : null,
    [data]
  );

  return { diagram, diagramError, ...result };
};
