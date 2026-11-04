import { FunctionTab } from '@/lib/database-schema/components/function-tab/function-tab';
import { TableTab } from '@/lib/database-schema/components/table-tab/table-tab';
import { SqlTab } from '@/lib/query/components/sql-tab/sql-tab';
import { Tabs, TabsPanel } from '@/shared/components/ui/tabs';

import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';
import type { WorkspaceTab } from '../../../utils/workspace-tabs.utils';
import { WorkspaceTabBar } from '../workspace-tab-bar/workspace-tab-bar';
import { WorkspaceTabsEmpty } from '../workspace-tabs-empty/workspace-tabs-empty';

type Props = { connectionId: string; connectionName: string };

export const WorkspaceTabs = ({ connectionId, connectionName }: Props) => {
  const {
    tabs,
    activeKey,
    activateTab,
    pinTab,
    changeTabState,
    getHiddenColumns,
    changeHiddenColumns
  } = useWorkspaceTabs();
  const activeTab = tabs.find(tab => tab.key === activeKey);

  if (!tabs.length) return <WorkspaceTabsEmpty />;

  const renderTab = (tab: WorkspaceTab) => {
    const key = `${connectionId}:${tab.key}`;

    if (tab.kind === 'draft') {
      return (
        <SqlTab
          key={key}
          connectionId={connectionId}
          connectionName={connectionName}
          tabKey={tab.key}
        />
      );
    }

    if (tab.kind === 'function') {
      return <FunctionTab key={key} connectionId={connectionId} object={tab} />;
    }

    return (
      <TableTab
        key={key}
        connectionId={connectionId}
        object={tab}
        state={tab.state}
        onStateChange={state => changeTabState(tab.key, state)}
        hiddenColumns={getHiddenColumns(tab.key)}
        onHiddenColumnsChange={columns => changeHiddenColumns(tab.key, columns)}
        onPin={() => pinTab(tab.key)}
      />
    );
  };

  return (
    <Tabs
      value={activeKey}
      onValueChange={(key: string) => activateTab(key)}
      className="h-full min-h-0 gap-0"
    >
      <WorkspaceTabBar />
      {activeTab && (
        <TabsPanel value={activeTab.key} className="min-h-0">
          {renderTab(activeTab)}
        </TabsPanel>
      )}
    </Tabs>
  );
};
