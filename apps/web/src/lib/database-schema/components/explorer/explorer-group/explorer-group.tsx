import { type ReactNode, useState } from 'react';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/shared/components/ui/sidebar';

import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';

type Props = {
  label: string;
  count: number;
  isSearching: boolean;
  defaultOpen: boolean;
  children: ReactNode;
};

export const ExplorerGroup = ({ label, count, isSearching, defaultOpen, children }: Props) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SidebarMenuItem>
      <Collapsible open={isSearching || isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger render={<SidebarMenuButton size="sm" />}>
          <ExplorerChevron />
          <span className="flex-1 truncate">{label}</span>
          <span className="text-muted-foreground tabular-nums">{count}</span>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <SidebarMenuSub className="mx-0 ms-2 gap-0 border-none px-0">{children}</SidebarMenuSub>
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
