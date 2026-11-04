import { GET_FUNCTION_DEFINITION_QUERY } from '@/lib/api/operations/database-schema.operations';
import type { FunctionDefinitionInput } from '@/lib/api/types';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';
import { getTableQueryError } from '../utils/table-view.utils';

export const useGetFunctionDefinition = (input: FunctionDefinitionInput) => {
  const result = useGqlQuery(GET_FUNCTION_DEFINITION_QUERY, {
    key: [DatabaseSchemaCacheKeys.FunctionDefinition],
    variables: { input }
  });

  const [apiError] = result.data?.functionDefinition.apiErrors ?? [];
  const definition = result.data?.functionDefinition.definition ?? null;
  const definitionError = getTableQueryError(apiError, result.isError);

  return { definition, definitionError, ...result };
};
