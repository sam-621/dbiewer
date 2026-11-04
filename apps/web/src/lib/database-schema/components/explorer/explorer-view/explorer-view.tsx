import { useTranslation } from 'react-i18next';

import { getTabKey } from '@/lib/workspace/utils/workspace-tabs.utils';
import { EyeIcon, OpenIcon } from '@/shared/components/icons/icons';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from '@/shared/components/ui/collapsible';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerChevron } from '../explorer-chevron/explorer-chevron';
import { ExplorerColumns } from '../explorer-columns/explorer-columns';
import { ExplorerName } from '../explorer-name/explorer-name';
import type { ChangeExplorerExpanded, OpenExplorerObject } from '../explorer-object';

type Props = {
  schemaName: string;
  view: DbSchemaNode['views'][number];
  expandedIds: string[];
  onExpandedChange: ChangeExplorerExpanded;
  activeTabKey?: string | null;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerView = ({
  schemaName,
  view,
  expandedIds,
  onExpandedChange,
  activeTabKey,
  onOpenObject
}: Props) => {
  const { t } = useTranslation();
  const object = { kind: 'view' as const, schema: schemaName, name: view.name };
  const id = getTabKey(object);

  return (
    <SidebarMenuItem>
      <Collapsible
        open={expandedIds.includes(id)}
        onOpenChange={isOpen => onExpandedChange(id, isOpen)}
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              size="sm"
              className="data-[active=true]:font-normal"
              isActive={activeTabKey === id}
            />
          }
          onClick={event => {
            if (event.detail > 1) event.preventBaseUIHandler();
          }}
          onDoubleClick={() => onOpenObject?.(object, { isPinned: false })}
        >
          <ExplorerChevron />
          <EyeIcon className="text-muted-foreground" />
          <ExplorerName name={view.name} />
        </CollapsibleTrigger>
        <SidebarMenuAction
          showOnHover
          aria-label={t('Open {{name}}', { name: view.name })}
          title={t('Open {{name}}', { name: view.name })}
          onClick={() => onOpenObject?.(object, { isPinned: false })}
        >
          <OpenIcon className="size-3.5" />
        </SidebarMenuAction>
        <CollapsiblePanel>
          <ExplorerColumns columns={view.columns} />
        </CollapsiblePanel>
      </Collapsible>
    </SidebarMenuItem>
  );
};
