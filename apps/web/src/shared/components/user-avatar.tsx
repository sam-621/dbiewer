import BoringAvatar from 'boring-avatars';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';

const AVATAR_VARIANT = 'marble';
const AVATAR_COLORS = ['#fb923c', '#f472b6', '#8b5cf6', '#60a5fa', '#34d399'];

type Props = {
  id?: string | null;
  image?: string | null;
  className?: string;
};

export const UserAvatar = ({ id, image, className }: Props) => {
  if (!id) {
    return <Skeleton aria-hidden className={cn('size-6 shrink-0 rounded-full', className)} />;
  }

  return (
    <Avatar aria-hidden className={cn('size-6', className)}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback className="bg-transparent">
        <BoringAvatar
          name={id}
          variant={AVATAR_VARIANT}
          colors={AVATAR_COLORS}
          className="size-full shrink-0 rounded-full"
        />
      </AvatarFallback>
    </Avatar>
  );
};
