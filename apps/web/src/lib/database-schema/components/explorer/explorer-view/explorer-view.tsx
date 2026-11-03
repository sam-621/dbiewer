import { useTranslation } from 'react-i18next';

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
import type { OpenExplorerObject } from '../explorer-object';

type Props = {
  schemaName: string;
  view: DbSchemaNode['views'][number];
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerView = ({ schemaName, view, onOpenObject }: Props) => {
  const { t } = useTranslation();
  const object = { kind: 'view' as const, schema: schemaName, name: view.name };

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
          <EyeIcon className="text-muted-foreground" />
          <span title={view.name} className="truncate font-mono">
            {view.name}
          </span>
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
