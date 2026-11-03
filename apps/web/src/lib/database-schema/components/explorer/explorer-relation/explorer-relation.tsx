import { EyeIcon, TableIcon } from '@/shared/components/icons/icons';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import { ExplorerColumns } from '../explorer-columns/explorer-columns';
import type { OpenExplorerObject } from '../explorer-object';

type Props = {
  kind: 'table' | 'view';
  schemaName: string;
  relation: DbSchemaNode['views'][number];
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerRelation = ({ kind, schemaName, relation, onOpenObject }: Props) => {
  const Icon = kind === 'table' ? TableIcon : EyeIcon;
  const object = { kind, schema: schemaName, name: relation.name };

  return (
    <SidebarMenuItem>
      <Collapsible>
        <CollapsibleTrigger
          render={<SidebarMenuButton size="sm" />}
          onClick={event => {
            if (event.detail > 1) event.preventBaseUIHandler();
          }}
          onDoubleClick={() => onOpenObject?.(object, { isPinned: false })}
        >
          <ExplorerChevron />
          <Icon className="text-muted-foreground" />
          <span title={relation.name} className="truncate font-mono">
            {relation.name}
          </span>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <ExplorerColumns columns={relation.columns} />
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
