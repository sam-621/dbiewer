import { useTranslation } from 'react-i18next';

import { getTabKey } from '@/lib/workspace/utils/workspace-tabs.utils';
import { TableIcon } from '@/shared/components/icons/icons';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import { SidebarMenuButton, SidebarMenuItem } from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import { ExplorerColumns } from '../explorer-columns/explorer-columns';
import { ExplorerName } from '../explorer-name/explorer-name';
import type { ChangeExplorerExpanded, OpenExplorerObject } from '../explorer-object';

type Props = {
  schemaName: string;
  table: DbSchemaNode['tables'][number];
  expandedIds: string[];
  onExpandedChange: ChangeExplorerExpanded;
  activeTabKey?: string | null;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerTable = ({
  schemaName,
  table,
  expandedIds,
  onExpandedChange,
  activeTabKey,
  onOpenObject
}: Props) => {
  const { t } = useTranslation();
  const object = { kind: 'table' as const, schema: schemaName, name: table.name };
  const id = getTabKey(object);

  return (
    <SidebarMenuItem>
      <Collapsible
        open={expandedIds.includes(id)}
        onOpenChange={isOpen => onExpandedChange(id, isOpen)}
      >
        <div className="relative">
          <SidebarMenuButton
            size="sm"
            className="ps-8 data-[active=true]:font-normal"
            isActive={activeTabKey === id}
            onClick={() => onOpenObject?.(object, { isPinned: false })}
          >
            <TableIcon className="text-muted-foreground" />
            <ExplorerName name={table.name} />
          </SidebarMenuButton>
          <CollapsibleTrigger
            aria-label={t('Columns of {{name}}', { name: table.name })}
            className="absolute start-1 top-0.5 flex size-6 items-center justify-center rounded-md outline-hidden hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <ExplorerChevron />
          </CollapsibleTrigger>
        </div>
        <CollapsiblePanel>
          <ExplorerColumns columns={table.columns} />
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
