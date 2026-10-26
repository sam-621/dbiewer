import { Navigate, Outlet } from 'react-router';

import { useGetMe } from '@/lib/account/hooks/use-get-me';

import { GuardLoading } from './guard-loading';

export const Public = () => {
  const { isLoading, me } = useGetMe();

  if (isLoading) return <GuardLoading />;
  if (me) return <Navigate to="/" replace />;

  return <Outlet />;
};
