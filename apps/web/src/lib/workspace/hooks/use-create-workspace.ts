import { useQueryClient } from '@tanstack/react-query';

import { AccountCacheKeys } from '@/lib/account/constants/cache-keys';
import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getWorkspaceError } from '@/lib/api/errors/workspace.errors';
import { CREATE_WORKSPACE_MUTATION } from '@/lib/api/operations/account.operations';
import type { ActionResult, CreateWorkspaceInput, WorkspaceErrorCode } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(CREATE_WORKSPACE_MUTATION);

  const createWorkspace = async (
    input: CreateWorkspaceInput
  ): Promise<ActionResult<WorkspaceErrorCode>> => {
    try {
      const { createWorkspace } = await mutateAsync({ input });
      const [apiError] = createWorkspace.apiErrors;

      if (apiError) return { isSuccess: false, ...getWorkspaceError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [AccountCacheKeys.Me] });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { createWorkspace, isLoading: isPending };
};
