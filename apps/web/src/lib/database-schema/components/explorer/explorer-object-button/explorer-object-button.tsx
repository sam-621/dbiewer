import type { ReactNode } from 'react';

import { SidebarMenuButton } from '@/shared/components/ui/sidebar';

import type { ExplorerObject, OpenExplorerObject } from '../explorer-object';

type Props = {
  object: ExplorerObject;
  onOpenObject?: OpenExplorerObject;
  children: ReactNode;
};

export const ExplorerObjectButton = ({ object, onOpenObject, children }: Props) => (
  <SidebarMenuButton
    size="sm"
    className="min-w-0 flex-1"
    onDoubleClick={() => onOpenObject?.(object, { isPinned: false })}
  >
    {children}
  </SidebarMenuButton>
);
