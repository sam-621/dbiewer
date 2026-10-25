import { type QueryKey, useQuery } from '@tanstack/react-query';

import type { TypedDocumentString } from '@/lib/api/codegen/graphql';
import { gqlFetcher } from '@/lib/api/fetcher';

type Options<TVariables> = {
  key: QueryKey;
  variables?: TVariables;
  enabled?: boolean;
};

export const useGqlQuery = <TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  { key, variables, enabled }: Options<TVariables>
) =>
  useQuery({
    queryKey: variables ? [...key, variables] : key,
    queryFn: () => gqlFetcher(document, variables),
    enabled
  });
