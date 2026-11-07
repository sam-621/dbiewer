import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/lib/api/auth-client';
import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import type { ActionResult } from '@/lib/api/types';
import { Logger } from '@/shared/utils/logger';

export const useSignInGithub = () => {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: () =>
      authClient.signIn.social({
        provider: 'github',
        callbackURL: `${window.location.origin}/`,
        errorCallbackURL: `${window.location.origin}/login`
      })
  });

  const signInGithub = async (): Promise<ActionResult> => {
    try {
      const { error } = await mutateAsync();

      if (!error) return { isSuccess: true };

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { signInGithub, isLoading: isPending };
};
