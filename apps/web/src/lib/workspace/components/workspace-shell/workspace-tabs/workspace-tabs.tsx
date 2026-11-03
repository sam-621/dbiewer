import { TableTab } from '@/lib/database-schema/components/table-tab/table-tab';
import { Tabs, TabsPanel } from '@/shared/components/ui/tabs';

import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';
import { WorkspaceTabBar } from '../workspace-tab-bar/workspace-tab-bar';
import { WorkspaceTabsEmpty } from '../workspace-tabs-empty/workspace-tabs-empty';

export const WorkspaceTabs = ({ connectionId }: { connectionId: string }) => {
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
          <TableTab
            key={`${connectionId}:${activeTab.key}`}
            connectionId={connectionId}
            object={activeTab}
            state={activeTab.state}
            onStateChange={state => changeTabState(activeTab.key, state)}
            onPin={() => pinTab(activeTab.key)}
          />
        </TabsPanel>
      )}
    </Tabs>
  );
};
