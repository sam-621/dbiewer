import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authClient } from '@/lib/api/auth-client';
import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import type { ActionResult } from '@/lib/api/types';
import { Logger } from '@/shared/utils/logger';

import { AccountCacheKeys } from '../constants/cache-keys';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useMutation({
    mutationFn: () => authClient.signOut()
  });

  const signOut = async (): Promise<ActionResult> => {
    try {
      const { error } = await mutateAsync();

      if (!error) {
        await queryClient.invalidateQueries({ queryKey: [AccountCacheKeys.Me] });
        return { isSuccess: true };
      }

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { signOut, isLoading: isPending };
};
