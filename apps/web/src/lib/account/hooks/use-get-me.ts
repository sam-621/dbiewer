import { GET_ME_QUERY } from '@/lib/api/operations/account.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { AccountCacheKeys } from '../constants/cache-keys';

export const useGetMe = () => {
  const result = useGqlQuery(GET_ME_QUERY, { key: [AccountCacheKeys.Me] });

  return { me: result.data?.me ?? null, ...result };
};
