import { useTranslation } from 'react-i18next';

import type { WorkspaceTab } from '../utils/workspace-tabs.utils';

export const useTabName = () => {
  const { t } = useTranslation();

  return (tab: WorkspaceTab) => {
    if (tab.kind === 'draft') return t('Untitled {{number}}', { number: tab.number });
    return tab.kind === 'function' ? `${tab.name}(${tab.arguments})` : tab.name;
  };
};
