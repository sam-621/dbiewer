import { UserAvatar } from '@/shared/components/user-avatar';

import { useGetMe } from '../../hooks/use-get-me';

export const SessionUser = () => {
  const { me } = useGetMe();
  const user = me?.user;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar id={user?.id} image={user?.image} className="size-8" />
      <div className="flex min-w-0 flex-col text-left">
        {user?.name && <span className="truncate text-sm font-medium">{user.name}</span>}
        {user?.email && (
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        )}
      </div>
    </div>
  );
};
