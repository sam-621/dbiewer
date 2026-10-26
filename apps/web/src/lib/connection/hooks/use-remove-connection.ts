import { useQueryClient } from '@tanstack/react-query';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getConnectionError } from '@/lib/api/errors/connection.errors';
import { REMOVE_CONNECTION_MUTATION } from '@/lib/api/operations/connection.operations';
import type { ActionResult, ConnectionErrorCode } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { ConnectionCacheKeys } from '../constants/cache-keys';

export const useRemoveConnection = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(REMOVE_CONNECTION_MUTATION);

  const removeConnection = async (
    connectionId: string
  ): Promise<ActionResult<ConnectionErrorCode>> => {
    try {
      const { removeConnection } = await mutateAsync({ connectionId });
      const [apiError] = removeConnection.apiErrors;

      if (apiError) return { isSuccess: false, ...getConnectionError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [ConnectionCacheKeys.Connections] });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { removeConnection, isLoading: isPending };
};
