import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import { ExplorerGroups } from '../explorer-groups/explorer-groups';
import type { ChangeExplorerExpanded, OpenExplorerObject } from '../explorer-object';

type Props = {
  schema: DbSchemaNode;
  isSearching: boolean;
  expandedIds: string[];
  onExpandedChange: ChangeExplorerExpanded;
  activeTabKey?: string | null;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerSchema = ({
  schema,
  isSearching,
  expandedIds,
  onExpandedChange,
  activeTabKey,
  onOpenObject
}: Props) => {
  const id = `schema:${schema.name}`;

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isSearching || expandedIds.includes(id)}
        onOpenChange={isOpen => {
          if (!isSearching) onExpandedChange(id, isOpen);
        }}
      >
        <CollapsibleTrigger render={<SidebarMenuButton size="sm" />}>
          <ExplorerChevron />
          <span>{schema.name}</span>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <SidebarMenuSub className="mx-0 ms-2 gap-0 border-none px-0">
            <ExplorerGroups
              schema={schema}
              isSearching={isSearching}
              expandedIds={expandedIds}
              onExpandedChange={onExpandedChange}
              activeTabKey={activeTabKey}
              onOpenObject={onOpenObject}
            />
          </SidebarMenuSub>
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
