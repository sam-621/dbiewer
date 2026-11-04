import { useQueryClient } from '@tanstack/react-query';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getFileError } from '@/lib/api/errors/file.errors';
import { REMOVE_FILE_MUTATION } from '@/lib/api/operations/file.operations';
import type { ActionResult, FileErrorCode } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { FileCacheKeys } from '../constants/cache-keys';

export const useRemoveFile = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(REMOVE_FILE_MUTATION);

  const removeFile = async (id: string): Promise<ActionResult<FileErrorCode>> => {
    try {
      const { removeFile } = await mutateAsync({ id });
      const [apiError] = removeFile.apiErrors;

      if (apiError) return { isSuccess: false, ...getFileError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [FileCacheKeys.Files] });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { removeFile, isLoading: isPending };
};
