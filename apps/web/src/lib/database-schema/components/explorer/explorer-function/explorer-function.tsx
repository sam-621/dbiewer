import { getTabKey } from '@/lib/workspace/utils/workspace-tabs.utils';
import { CodeIcon } from '@/shared/components/icons/icons';
import { SidebarMenuItem } from '@/shared/components/ui/sidebar';

import type { DbSchemaNode } from '../../../utils/database-schema.utils';
import { ExplorerName } from '../explorer-name/explorer-name';
import type { OpenExplorerObject } from '../explorer-object';
import { ExplorerObjectButton } from '../explorer-object-button/explorer-object-button';

type Props = {
  schemaName: string;
  fn: DbSchemaNode['functions'][number];
  activeTabKey?: string | null;
  onOpenObject?: OpenExplorerObject;
};

export const ExplorerFunction = ({ schemaName, fn, activeTabKey, onOpenObject }: Props) => {
  const signature = `${fn.name}(${fn.arguments})`;
  const object = {
    kind: 'function' as const,
    schema: schemaName,
    name: fn.name,
    arguments: fn.arguments
  };

  return (
    <SidebarMenuItem>
      <ExplorerObjectButton
        object={object}
        isActive={activeTabKey === getTabKey(object)}
        onOpenObject={onOpenObject}
      >
        <span aria-hidden="true" className="size-4 shrink-0" />
        <CodeIcon className="text-sql-fn" />
        <ExplorerName name={signature} />
      </ExplorerObjectButton>
    </SidebarMenuItem>
  );
};
