import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { gqlFetcher } from '@/lib/api/fetcher';
import { GET_TABLE_ROWS_QUERY } from '@/lib/api/operations/database-schema.operations';
import type { DbObjectInput } from '@/lib/api/types';

import { DatabaseSchemaCacheKeys } from '../constants/cache-keys';
import { getTableQueryError, type TableViewState } from '../utils/table-view.utils';

type Params = DbObjectInput & Pick<TableViewState, 'filters' | 'orderBy' | 'page'>;

export const useGetTableRows = ({ filters, orderBy, ...input }: Params) => {
  const variables = { input: { ...input, filters, orderBy } };

  const result = useQuery({
    queryKey: [DatabaseSchemaCacheKeys.TableRows, variables],
    queryFn: async () => {
      const startedAt = performance.now();
      const data = await gqlFetcher(GET_TABLE_ROWS_QUERY, variables);
      return { ...data, durationMs: Math.round(performance.now() - startedAt) };
    },
    placeholderData: keepPreviousData
  });

  const [apiError] = result.data?.tableRows.apiErrors ?? [];
  const tableRows = result.data?.tableRows.tableRows ?? null;
  const rowsError = getTableQueryError(apiError, result.isError);

  return { tableRows, rowsError, durationMs: result.data?.durationMs ?? null, ...result };
};
