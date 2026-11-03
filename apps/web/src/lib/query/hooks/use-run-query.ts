import { GENERIC_ERROR } from '@/lib/api/errors/api-error';
import { getShellError } from '@/lib/api/errors/shell.errors';
import { RUN_QUERY_MUTATION } from '@/lib/api/operations/query.operations';
import type {
  ActionResult,
  RunQueryInput,
  RunQueryMutation,
  ShellErrorCode
} from '@/lib/api/types';
import { useGqlMutation } from '@/shared/hooks/use-gql-mutation';
import { Logger } from '@/shared/utils/logger';

type QueryExecution = NonNullable<RunQueryMutation['runQuery']['execution']>;

export type RunQueryResult =
  | { isSuccess: true; execution: QueryExecution }
  | (Extract<ActionResult<ShellErrorCode>, { isSuccess: false }> & { detail?: string });

export const useRunQuery = () => {
  const { isPending, mutateAsync } = useGqlMutation(RUN_QUERY_MUTATION);

  const runQuery = async (input: RunQueryInput): Promise<RunQueryResult> => {
    try {
      const { runQuery } = await mutateAsync({ input });
      const [apiError] = runQuery.apiErrors;

      if (apiError) {
        return { isSuccess: false, ...getShellError(apiError.code), detail: apiError.message };
      }
      if (!runQuery.execution) return { isSuccess: false, error: GENERIC_ERROR };

      return { isSuccess: true, execution: runQuery.execution };
    } catch (error) {
      Logger.error(error);
      return { isSuccess: false, error: GENERIC_ERROR };
    }
  };

  return { runQuery, isLoading: isPending };
};
