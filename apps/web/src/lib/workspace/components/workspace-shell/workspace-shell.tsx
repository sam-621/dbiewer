import type { CSSProperties } from 'react';

import { SidebarProvider } from '@/shared/components/ui/sidebar';

import { WorkspaceTabsProvider } from '../../contexts/workspace-tabs-provider';
import { useActiveConnection } from '../../hooks/use-active-connection';
import { useSidebarWidth } from '../../hooks/use-sidebar-width';

import { WorkspaceSidebar } from './workspace-sidebar/workspace-sidebar';
import { WorkspaceSidebarResizer } from './workspace-sidebar-resizer/workspace-sidebar-resizer';
import { WorkspaceStatusBar } from './workspace-status-bar/workspace-status-bar';
import { WorkspaceTabs } from './workspace-tabs/workspace-tabs';

export const WorkspaceShell = () => {
  const { width, changeWidth } = useSidebarWidth();
  const { activeConnection } = useActiveConnection();

  if (!activeConnection) return null;

  return (
    <WorkspaceTabsProvider connectionId={activeConnection.id}>
      <SidebarProvider
        className="min-h-0 flex-1 px-1.5"
        style={{ '--sidebar-width': `${width}px` } as CSSProperties}
      >
        <WorkspaceSidebar connectionId={activeConnection.id} />
        <WorkspaceSidebarResizer width={width} onWidthChange={changeWidth} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-shell bg-background">
          <WorkspaceTabs
            connectionId={activeConnection.id}
            connectionName={activeConnection.name}
          />
        </div>
      </SidebarProvider>
      <WorkspaceStatusBar connection={activeConnection} />
    </WorkspaceTabsProvider>
  );
};
