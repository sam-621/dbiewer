import type { ReactNode } from 'react';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/shared/components/ui/sidebar';

import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import type { ChangeExplorerExpanded } from '../explorer-object';

type Props = {
  id: string;
  label: string;
  count: number;
  isSearching: boolean;
  expandedIds: string[];
  onExpandedChange: ChangeExplorerExpanded;
  children: ReactNode;
};

export const ExplorerGroup = ({
  id,
  label,
  count,
  isSearching,
  expandedIds,
  onExpandedChange,
  children
}: Props) => (
  <SidebarMenuItem>
    <Collapsible
      open={isSearching || expandedIds.includes(id)}
      onOpenChange={isOpen => {
        if (!isSearching) onExpandedChange(id, isOpen);
      }}
    >
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
