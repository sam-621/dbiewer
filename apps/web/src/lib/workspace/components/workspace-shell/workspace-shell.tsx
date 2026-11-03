import type { CSSProperties, ReactNode } from 'react';

import { SidebarProvider } from '@/shared/components/ui/sidebar';

import { useSidebarWidth } from '../../hooks/use-sidebar-width';

import { WorkspaceSidebar } from './workspace-sidebar/workspace-sidebar';
import { WorkspaceSidebarResizer } from './workspace-sidebar-resizer/workspace-sidebar-resizer';

export const WorkspaceShell = ({ children }: { children: ReactNode }) => {
  const { width, changeWidth } = useSidebarWidth();

  return (
    <SidebarProvider
      className="min-h-0 flex-1"
      style={{ '--sidebar-width': `${width}px` } as CSSProperties}
    >
      <WorkspaceSidebar />
      <WorkspaceSidebarResizer width={width} onWidthChange={changeWidth} />
      <div className="min-w-0 flex-1 overflow-auto">{children}</div>
    </SidebarProvider>
  );
};
