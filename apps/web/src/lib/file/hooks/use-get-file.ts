import { getFragmentData } from '@/lib/api/codegen';
import { COMMON_FILE_FRAGMENT, GET_FILE_QUERY } from '@/lib/api/operations/file.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { FileCacheKeys } from '../constants/cache-keys';

export const useGetFile = (id: string | null) => {
  const result = useGqlQuery(GET_FILE_QUERY, {
    key: [FileCacheKeys.File],
    variables: { id: id ?? '' },
    enabled: id !== null
  });

  const file = getFragmentData(COMMON_FILE_FRAGMENT, result.data?.file) ?? null;

  return { file, ...result };
};
