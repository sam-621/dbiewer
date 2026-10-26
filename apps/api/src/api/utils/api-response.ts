import { BusinessError } from '@/shared/errors/business-error';

export const apiResponse = <TResult, TKey extends string>(result: TResult, key: TKey) => {
  if (result instanceof BusinessError) {
    return {
      apiErrors: [{ code: result.code, message: result.message }],
      [key]: null
    };
  }

  return { apiErrors: [], [key]: result };
};
