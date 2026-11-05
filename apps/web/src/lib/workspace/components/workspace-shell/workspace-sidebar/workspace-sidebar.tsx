import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Explorer } from '@/lib/database-schema/components/explorer/explorer';
import { ExplorerCollapseButton } from '@/lib/database-schema/components/explorer-collapse-button/explorer-collapse-button';
import { ExplorerDiagramButton } from '@/lib/database-schema/components/explorer-diagram-button/explorer-diagram-button';
import { ExplorerReloadButton } from '@/lib/database-schema/components/explorer-reload-button/explorer-reload-button';
import { useExplorerExpanded } from '@/lib/database-schema/hooks/use-explorer-expanded';
import { FilesTab } from '@/lib/file/components/files-tab/files-tab';
import { MagnifyingGlassIcon } from '@/shared/components/icons/icons';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';
import { Sidebar, SidebarContent, SidebarHeader } from '@/shared/components/ui/sidebar';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/shared/components/ui/tabs';

import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';

type SidebarTab = 'explorer' | 'files';

const SEARCH_PLACEHOLDERS: Record<SidebarTab, string> = {
  explorer: 'Search tables, views…',
  files: 'Filter files…'
};

export const WorkspaceSidebar = ({ connectionId }: { connectionId: string }) => {
  const { t } = useTranslation();
  const { activeKey, openObject, openDiagram } = useWorkspaceTabs();
  const [tab, setTab] = useState<SidebarTab>('explorer');
  const [searches, setSearches] = useState<Record<SidebarTab, string>>({
    explorer: '',
    files: ''
  });
  const { expandedIds, changeExpanded, collapseAll } = useExplorerExpanded(connectionId);

  return (
    <Sidebar collapsible="none" className="overflow-hidden rounded-shell bg-background">
      <Tabs
        value={tab}
        onValueChange={(value: SidebarTab) => setTab(value)}
        className="min-h-0 flex-1 gap-0"
      >
        <SidebarHeader>
          <div className="flex items-center justify-between gap-1">
            <TabsList className="grid min-w-0 grid-cols-2">
              <TabsTab value="explorer" className="min-w-0 shrink">
                <span className="truncate">{t('Explorer')}</span>
              </TabsTab>
              <TabsTab value="files" className="min-w-0 shrink">
                <span className="truncate">{t('Files')}</span>
              </TabsTab>
            </TabsList>
            {tab === 'explorer' && (
              <div className="flex shrink-0 items-center gap-1">
                <ExplorerDiagramButton onOpen={openDiagram} />
                <ExplorerCollapseButton onCollapse={collapseAll} />
                <ExplorerReloadButton connectionId={connectionId} />
              </div>
            )}
          </div>
          <InputGroup>
            <InputGroupAddon>
              <MagnifyingGlassIcon />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              size="sm"
              placeholder={t(SEARCH_PLACEHOLDERS[tab])}
              value={searches[tab]}
              onChange={event => setSearches({ ...searches, [tab]: event.target.value })}
            />
          </InputGroup>
        </SidebarHeader>
        <SidebarContent>
          <TabsPanel value="explorer" className="px-2 pb-2">
            <Explorer
              key={connectionId}
              connectionId={connectionId}
              search={searches.explorer}
              expandedIds={expandedIds}
              onExpandedChange={changeExpanded}
              activeTabKey={activeKey}
              onOpenObject={openObject}
            />
          </TabsPanel>
          <TabsPanel value="files" className="px-2 pb-2">
            <FilesTab key={connectionId} connectionId={connectionId} search={searches.files} />
          </TabsPanel>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
};
