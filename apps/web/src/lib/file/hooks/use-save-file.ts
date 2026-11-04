import { useQueryClient } from '@tanstack/react-query';

import { getFragmentData } from '@/lib/api/codegen';
import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getFileError } from '@/lib/api/errors/file.errors';
import { COMMON_FILE_FRAGMENT, SAVE_FILE_MUTATION } from '@/lib/api/operations/file.operations';
import type {
  ActionResult,
  CommonFileFragment,
  FileErrorCode,
  SaveFileInput
} from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { FileCacheKeys } from '../constants/cache-keys';

type SaveFileResult =
  | { isSuccess: true; file: CommonFileFragment }
  | Extract<ActionResult<FileErrorCode>, { isSuccess: false }>;

export const useSaveFile = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(SAVE_FILE_MUTATION);

  const saveFile = async (input: SaveFileInput): Promise<SaveFileResult> => {
    try {
      const { saveFile } = await mutateAsync({ input });
      const [apiError] = saveFile.apiErrors;

      if (apiError) return { isSuccess: false, ...getFileError(apiError.code) };

      const file = getFragmentData(COMMON_FILE_FRAGMENT, saveFile.file);
      if (!file) return { isSuccess: false, error: GENERIC_ERROR };

      queryClient.setQueryData([FileCacheKeys.File, { id: file.id }], { file: saveFile.file });
      await queryClient.refetchQueries({ queryKey: [FileCacheKeys.Files] });
      return { isSuccess: true, file };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { saveFile, isLoading: isPending };
};
