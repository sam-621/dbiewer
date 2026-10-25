export * from './codegen/graphql';

export type ActionResult<TErrorCode extends string = string> =
  { isSuccess: true } | { isSuccess: false; error: string; errorCode?: TErrorCode };
