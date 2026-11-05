import { useCallback, useLayoutEffect, useRef } from 'react';

export const useStableCallback = <TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult
) => {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: TArgs) => callbackRef.current(...args), []);
};
