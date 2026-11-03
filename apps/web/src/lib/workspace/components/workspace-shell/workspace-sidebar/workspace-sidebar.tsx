import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Explorer } from '@/lib/database-schema/components/explorer/explorer';
import { ExplorerReloadButton } from '@/lib/database-schema/components/explorer-reload-button/explorer-reload-button';
import { SavedQueriesEmpty } from '@/lib/query/components/saved-queries-empty/saved-queries-empty';
import { MagnifyingGlassIcon } from '@/shared/components/icons/icons';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';
import { Sidebar, SidebarContent, SidebarHeader } from '@/shared/components/ui/sidebar';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/shared/components/ui/tabs';

import { useActiveConnection } from '../../../hooks/use-active-connection';

type SidebarTab = 'explorer' | 'queries';

const SEARCH_PLACEHOLDERS: Record<SidebarTab, string> = {
  explorer: 'Search tables, views…',
  queries: 'Filter queries…'
};

export const WorkspaceSidebar = () => {
  const { t } = useTranslation();
  const { activeConnection } = useActiveConnection();
  const [tab, setTab] = useState<SidebarTab>('explorer');
  const [searches, setSearches] = useState<Record<SidebarTab, string>>({
    explorer: '',
    queries: ''
  });

  if (!activeConnection) return null;

  return (
    <Sidebar collapsible="none" className="border-e">
      <Tabs
        value={tab}
        onValueChange={(value: SidebarTab) => setTab(value)}
        className="min-h-0 flex-1 gap-0"
      >
        <SidebarHeader>
          <TabsList className="w-full">
            <TabsTab value="explorer">{t('Explorer')}</TabsTab>
            <TabsTab value="queries">{t('Queries')}</TabsTab>
          </TabsList>
          <div className="flex items-center gap-1">
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
            {tab === 'explorer' && <ExplorerReloadButton connectionId={activeConnection.id} />}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <TabsPanel value="explorer" className="px-2 pb-2">
            <Explorer
              key={activeConnection.id}
              connectionId={activeConnection.id}
              search={searches.explorer}
            />
          </TabsPanel>
          <TabsPanel value="queries">
            <SavedQueriesEmpty />
          </TabsPanel>
        </SidebarContent>
      </Tabs>
    </Sidebar>
  );
};
