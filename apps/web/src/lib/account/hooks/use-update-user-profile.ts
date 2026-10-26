import { useQueryClient } from '@tanstack/react-query';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getUserError } from '@/lib/api/errors/user.errors';
import { UPDATE_USER_PROFILE_MUTATION } from '@/lib/api/operations/account.operations';
import type { ActionResult, UpdateUserProfileInput, UserErrorCode } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { AccountCacheKeys } from '../constants/cache-keys';

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(UPDATE_USER_PROFILE_MUTATION);

  const updateUserProfile = async (
    input: UpdateUserProfileInput
  ): Promise<ActionResult<UserErrorCode>> => {
    try {
      const { updateUserProfile } = await mutateAsync({ input });
      const [apiError] = updateUserProfile.apiErrors;

      if (apiError) return { isSuccess: false, ...getUserError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [AccountCacheKeys.Me] });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { updateUserProfile, isLoading: isPending };
};
