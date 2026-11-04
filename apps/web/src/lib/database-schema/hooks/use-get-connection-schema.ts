import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getShellError } from '@/lib/api/errors/shell.errors';
import { GET_CONNECTION_SCHEMA_QUERY } from '@/lib/api/operations/database-schema.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';

export const useGetConnectionSchema = (connectionId: string) => {
  const result = useGqlQuery(GET_CONNECTION_SCHEMA_QUERY, {
    key: [DatabaseSchemaCacheKeys.ConnectionSchema],
    variables: { connectionId }
  });

  const [apiError] = result.data?.connectionSchema.apiErrors ?? [];
  const schemas = result.data?.connectionSchema.schemas ?? [];
  const schemaError = apiError
    ? getShellError(apiError.code).error
    : result.isError
      ? GENERIC_ERROR
      : null;

  return { schemas, schemaError, ...result };
};
