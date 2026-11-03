import { GET_TABLE_STRUCTURE_QUERY } from '@/lib/api/operations/database-schema.operations';
import type { DbObjectInput } from '@/lib/api/types';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';
import { getTableQueryError } from '../utils/table-view.utils';

export const useGetTableStructure = (input: DbObjectInput) => {
  const result = useGqlQuery(GET_TABLE_STRUCTURE_QUERY, {
    key: [DatabaseSchemaCacheKeys.TableStructure],
    variables: { input }
  });

  const [apiError] = result.data?.tableStructure.apiErrors ?? [];
  const structure = result.data?.tableStructure.structure ?? null;
  const structureError = getTableQueryError(apiError, result.isError);

  return { structure, structureError, ...result };
};
