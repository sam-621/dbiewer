import { useState } from 'react';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import { ExplorerGroups } from '../explorer-groups/explorer-groups';
import type { OpenExplorerObject } from '../explorer-object';

type Props = {
  schema: DbSchemaNode;
  isSearching: boolean;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerSchema = ({ schema, isSearching, onOpenObject }: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarMenuItem>
      <Collapsible open={isSearching || isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger render={<SidebarMenuButton size="sm" />}>
          <ExplorerChevron />
          <span>{schema.name}</span>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <SidebarMenuSub className="mx-0 ms-2 gap-0 border-none px-0">
            <ExplorerGroups schema={schema} isSearching={isSearching} onOpenObject={onOpenObject} />
          </SidebarMenuSub>
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
