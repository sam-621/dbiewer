import { useQueryClient } from '@tanstack/react-query';

import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getConnectionError } from '@/lib/api/errors/connection.errors';
import { CREATE_CONNECTION_MUTATION } from '@/lib/api/operations/connection.operations';
import type { ActionResult, ConnectionErrorCode, CreateConnectionInput } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

import { ConnectionCacheKeys } from '../constants/cache-keys';

export const useCreateConnection = () => {
  const queryClient = useQueryClient();
  const { isPending, mutateAsync } = useGqlMutation(CREATE_CONNECTION_MUTATION);

  const createConnection = async (
    input: CreateConnectionInput
  ): Promise<ActionResult<ConnectionErrorCode>> => {
    try {
      const { createConnection } = await mutateAsync({ input });
      const [apiError] = createConnection.apiErrors;

      if (apiError) return { isSuccess: false, ...getConnectionError(apiError.code) };

      await queryClient.refetchQueries({ queryKey: [ConnectionCacheKeys.Connections] });
      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { createConnection, isLoading: isPending };
};
