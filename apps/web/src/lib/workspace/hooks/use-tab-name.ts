import { useTranslation } from 'react-i18next';

import type { WorkspaceTab } from '../utils/workspace-tabs.utils';

export const useTabName = () => {
  const { t } = useTranslation();

  return (tab: WorkspaceTab) => {
    if (tab.kind === 'diagram') return t('Diagram');
    if (tab.kind === 'draft') return t('Untitled {{number}}', { number: tab.number });
    if (tab.kind === 'file') return `${tab.name}.${tab.type}`;
    return tab.kind === 'function' ? `${tab.name}(${tab.arguments})` : tab.name;
  };
};
