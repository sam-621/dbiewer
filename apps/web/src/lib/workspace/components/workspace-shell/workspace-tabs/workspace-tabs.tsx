import { DiagramTab } from '@/lib/database-schema/components/diagram-tab/diagram-tab';
import { FunctionTab } from '@/lib/database-schema/components/function-tab/function-tab';
import { TableTab } from '@/lib/database-schema/components/table-tab/table-tab';
import { FileEditorTab } from '@/lib/file/components/file-editor-tab/file-editor-tab';
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
    changeHiddenColumns,
    getTableChanges,
    changeTableChanges,
    getDiagramNavigation,
    changeDiagramNavigation
  } = useWorkspaceTabs();
  const activeTab = tabs.find(tab => tab.key === activeKey);

  if (!tabs.length) return <WorkspaceTabsEmpty />;

  const renderTab = (tab: WorkspaceTab) => {
    const key = `${connectionId}:${tab.key}`;

    if (tab.kind === 'draft' || tab.kind === 'file') {
      return (
        <FileEditorTab
          key={tab.kind === 'file' && tab.draftKey ? `${connectionId}:${tab.draftKey}` : key}
          connectionId={connectionId}
          connectionName={connectionName}
          tab={tab}
        />
      );
    }

    if (tab.kind === 'diagram') {
      return (
        <DiagramTab
          key={key}
          connectionId={connectionId}
          initialNavigation={getDiagramNavigation(tab.key)}
          onNavigationChange={change => changeDiagramNavigation(tab.key, change)}
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
        changes={getTableChanges(tab.key)}
        onChangesChange={changes => changeTableChanges(tab.key, changes)}
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
