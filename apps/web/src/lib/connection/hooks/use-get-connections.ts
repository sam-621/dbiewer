import { getFragmentData } from '@/lib/api/codegen';
import {
  COMMON_CONNECTION_FRAGMENT,
  GET_CONNECTIONS_QUERY
} from '@/lib/api/operations/connection.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { ConnectionCacheKeys } from '../constants/cache-keys';

export const useGetConnections = () => {
  const result = useGqlQuery(GET_CONNECTIONS_QUERY, {
    key: [ConnectionCacheKeys.Connections]
  });

  const connections =
    result.data?.connections.items.map(c => getFragmentData(COMMON_CONNECTION_FRAGMENT, c)) ?? [];

  return { connections, ...result };
};
