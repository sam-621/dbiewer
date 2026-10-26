import { useMutation } from '@tanstack/react-query';

import { authClient } from '@/lib/api/auth-client';
import { type AccountErrorCode, getAccountError } from '@/lib/api/errors/account.errors';
import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import type { ActionResult } from '@/lib/api/types';
import { Logger } from '@/shared/utils/logger';

export const useSignInMagicLink = () => {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: (email: string) =>
      authClient.signIn.magicLink({
        email,
        callbackURL: `${window.location.origin}/`,
        errorCallbackURL: `${window.location.origin}/login`
      })
  });

  const signInMagicLink = async (email: string): Promise<ActionResult<AccountErrorCode>> => {
    try {
      const { error } = await mutateAsync(email);

      if (!error) return { isSuccess: true };

      const accountError = getAccountError(error);
      if (accountError) return { isSuccess: false, ...accountError };

      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { signInMagicLink, isLoading: isPending };
};
