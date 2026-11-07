import { useQueryClient } from '@tanstack/react-query';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getShellError } from '@/lib/api/errors/shell.errors';
import { SAVE_TABLE_CHANGES_MUTATION } from '@/lib/api/operations/database-schema.operations';
import type { ActionResult, SaveTableChangesInput, ShellErrorCode } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';

export type SaveTableChangesResult =
  | { isSuccess: true }
  | (Extract<ActionResult<ShellErrorCode>, { isSuccess: false }> & { detail?: string });

export const useSaveTableChanges = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(SAVE_TABLE_CHANGES_MUTATION);

  const saveTableChanges = async (
    input: SaveTableChangesInput
  ): Promise<SaveTableChangesResult> => {
    try {
      const { saveTableChanges } = await mutateAsync({ input });
      const [apiError] = saveTableChanges.apiErrors;

      if (apiError) {
        return { isSuccess: false, ...getShellError(apiError.code), detail: apiError.message };
      }

      const { connectionId, schema, name } = input;
      await queryClient.refetchQueries({
        queryKey: [DatabaseSchemaCacheKeys.TableRows, { input: { connectionId, schema, name } }]
      });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { saveTableChanges, isLoading: isPending };
};
