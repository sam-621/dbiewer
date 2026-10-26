import type { GraphQLFormattedError } from 'graphql';

import type { TypedDocumentString } from './codegen/graphql';
import { GqlError } from './errors/api-error';

type GqlResponse<TResult> = {
  data?: TResult | null;
  errors?: GraphQLFormattedError[];
};

export const gqlFetcher = async <TResult, TVariables>(
  document: TypedDocumentString<TResult, TVariables>,
  variables?: TVariables
): Promise<TResult> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/graphql`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/graphql-response+json'
    },
    body: JSON.stringify({ query: document.toString(), variables })
  });

  const body = (await response.json()) as GqlResponse<TResult>;

  if (body.errors?.length) throw new GqlError(body.errors);
  if (!body.data) throw new Error(`Empty GraphQL response with status ${response.status}`);

  return body.data;
};
