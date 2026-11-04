import type { ReactNode } from 'react';

import { SidebarMenuButton } from '@/shared/components/ui/sidebar';

import type { ExplorerObject, OpenExplorerObject } from '../explorer-object';

type Props = {
  object: ExplorerObject;
  isActive: boolean;
  onOpenObject?: OpenExplorerObject;
  children: ReactNode;
};

export const ExplorerObjectButton = ({ object, isActive, onOpenObject, children }: Props) => (
  <SidebarMenuButton
    size="sm"
    className="min-w-0 flex-1 data-[active=true]:font-normal"
    isActive={isActive}
    onClick={() => onOpenObject?.(object, { isPinned: false })}
  >
    {children}
  </SidebarMenuButton>
);
