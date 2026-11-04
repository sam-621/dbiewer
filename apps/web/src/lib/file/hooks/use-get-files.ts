import { getFragmentData } from '@/lib/api/codegen';
import { COMMON_FILE_FRAGMENT, GET_FILES_QUERY } from '@/lib/api/operations/file.operations';
import { useGqlQuery } from '@/shared/hooks/use-gql-query';

import { FileCacheKeys } from '../constants/cache-keys';

export const useGetFiles = (connectionId: string) => {
  const result = useGqlQuery(GET_FILES_QUERY, {
    key: [FileCacheKeys.Files],
    variables: { connectionId }
  });

  const files = result.data?.files.items.map(f => getFragmentData(COMMON_FILE_FRAGMENT, f)) ?? [];

  return { files, ...result };
};
