import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getConnectionError } from '@/lib/api/errors/connection.errors';
import { TEST_CONNECTION_MUTATION } from '@/lib/api/operations/connection.operations';
import type { ActionResult, ConnectionErrorCode, TestConnectionInput } from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

export const useTestConnection = () => {
  const { isPending, mutateAsync } = useGqlMutation(TEST_CONNECTION_MUTATION);

  const testConnection = async (
    input: TestConnectionInput
  ): Promise<ActionResult<ConnectionErrorCode>> => {
    try {
      const { testConnection } = await mutateAsync({ input });
      const [apiError] = testConnection.apiErrors;

      if (apiError) return { isSuccess: false, ...getConnectionError(apiError.code) };
      if (!testConnection.success) return { isSuccess: false, error: CONNECTION_FAILED };

      return { isSuccess: true };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { testConnection, isLoading: isPending };
};

const CONNECTION_FAILED = 'Connection failed';
