import { GET_HEALTH_QUERY } from '@/lib/api/operations/system.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { SystemCacheKeys } from '../constants/cache-keys';

export const useGetHealth = () => {
  const result = useGqlQuery(GET_HEALTH_QUERY, { key: [SystemCacheKeys.Health] });

  return { isHealthy: result.data?.health ?? false, ...result };
};
