import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useSignInGithub } from '../../hooks/use-sign-in-github';

export const useLoginForm = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasGithubError] = useState(() => searchParams.has('error'));
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { signInGithub, isLoading } = useSignInGithub();

  useEffect(() => {
    if (!hasGithubError) return;

    setSearchParams(
      params => {
        params.delete('error');
        return params;
      },
      { replace: true }
    );
  }, [hasGithubError, setSearchParams]);

  const onGithubSignIn = async () => {
    setError(null);
    const result = await signInGithub();

    if (!result.isSuccess) return setError(result.error);

    setIsRedirecting(true);
  };

  return { isLoading: isLoading || isRedirecting, hasGithubError, error, onGithubSignIn };
};
