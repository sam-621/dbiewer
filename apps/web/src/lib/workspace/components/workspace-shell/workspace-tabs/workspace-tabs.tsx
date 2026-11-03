import { TableTab } from '@/lib/database-schema/components/table-tab/table-tab';
import { SqlTab } from '@/lib/query/components/sql-tab/sql-tab';
import { Tabs, TabsPanel } from '@/shared/components/ui/tabs';

import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';
import { WorkspaceTabBar } from '../workspace-tab-bar/workspace-tab-bar';
import { WorkspaceTabsEmpty } from '../workspace-tabs-empty/workspace-tabs-empty';

type Props = { connectionId: string; connectionName: string };

export const WorkspaceTabs = ({ connectionId, connectionName }: Props) => {
  const { tabs, activeKey, activateTab, pinTab, changeTabState } = useWorkspaceTabs();
  const activeTab = tabs.find(tab => tab.key === activeKey);

  if (!tabs.length) return <WorkspaceTabsEmpty />;

  return (
    <Tabs
      value={activeKey}
      onValueChange={(key: string) => activateTab(key)}
      className="h-full min-h-0 gap-0"
    >
      <WorkspaceTabBar />
      {activeTab && (
        <TabsPanel value={activeTab.key} className="min-h-0">
          {activeTab.kind === 'draft' ? (
            <SqlTab
              key={`${connectionId}:${activeTab.key}`}
              connectionId={connectionId}
              connectionName={connectionName}
              tabKey={activeTab.key}
            />
          ) : (
            <TableTab
              key={`${connectionId}:${activeTab.key}`}
              connectionId={connectionId}
              object={activeTab}
              state={activeTab.state}
              onStateChange={state => changeTabState(activeTab.key, state)}
              onPin={() => pinTab(activeTab.key)}
            />
          )}
        </TabsPanel>
      )}
    </Tabs>
  );
};
