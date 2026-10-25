import { useMutation } from '@tanstack/react-query';

import type { TypedDocumentString } from '@/lib/api/codegen/graphql';
import { gqlFetcher } from '@/lib/api/fetcher';

export const useGqlMutation = <TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>
) =>
  useMutation({
    mutationFn: (variables: TVariables) => gqlFetcher(document, variables)
  });
