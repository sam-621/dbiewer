import { use } from 'react';

import { WorkspaceTabsContext } from '../contexts/workspace-tabs-context';

export const useWorkspaceTabs = () => {
  const context = use(WorkspaceTabsContext);
  if (!context) throw new Error('useWorkspaceTabs must be used within WorkspaceTabsProvider');

  return context;
};
