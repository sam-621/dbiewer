import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { countTableChanges } from '@/lib/database-schema/utils/table-changes.utils';
import { FILE_ICONS } from '@/lib/file/constants/file-types';
import { CodeIcon, DiagramIcon, EyeIcon, TableIcon, XIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { TabsList, TabsTab } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils/cn';

import { useTabName } from '../../../hooks/use-tab-name';
import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';
import type { WorkspaceTab } from '../../../utils/workspace-tabs.utils';

import { CloseTabDialog } from './close-tab-dialog/close-tab-dialog';

const OBJECT_ICONS = {
  table: TableIcon,
  view: EyeIcon,
  function: CodeIcon,
  diagram: DiagramIcon
};

const getTabIcon = (tab: WorkspaceTab) =>
  tab.kind === 'draft' || tab.kind === 'file' ? FILE_ICONS[tab.type] : OBJECT_ICONS[tab.kind];

export const WorkspaceTabBar = () => {
  const { t } = useTranslation();
  const { tabs, activeKey, provisionalKey, pinTab, closeTab, getTableChanges } = useWorkspaceTabs();
  const getTabName = useTabName();
  const [closingTab, setClosingTab] = useState<WorkspaceTab | null>(null);

  return (
    <>
      <TabsList
        variant="underline"
        aria-label={t('Open tabs')}
        className="h-11.5 w-full shrink-0 justify-start overflow-x-auto border-b px-2 data-[orientation=horizontal]:py-0 [scrollbar-width:none] *:data-[slot=tab-indicator]:hidden"
      >
        {tabs.map(tab => {
          const isActive = tab.key === activeKey;
          const isDirty =
            ('isDirty' in tab && tab.isDirty) ||
            (tab.kind === 'table' && countTableChanges(getTableChanges(tab.key)) > 0);
          const Icon = getTabIcon(tab);
          const name = getTabName(tab);

          return (
            <div
              key={tab.key}
              className={cn(
                'group/tab relative flex h-7.5 shrink-0 items-center rounded-md',
                isActive ? 'bg-input' : 'hover:bg-accent'
              )}
            >
              <TabsTab
                value={tab.key}
                title={'schema' in tab ? `${tab.schema}.${name}` : name}
                className="h-full grow-0 gap-1.5 border-0 ps-2.5 pe-8 hover:bg-transparent sm:h-full"
                onDoubleClick={() => pinTab(tab.key)}
              >
                <Icon className="size-3.5" />
                <span
                  className={cn(
                    'max-w-48 truncate text-xs',
                    tab.key === provisionalKey && 'italic'
                  )}
                >
                  {name}
                </span>
              </TabsTab>
              {isDirty && (
                <span
                  role="img"
                  aria-label={t('Unsaved changes')}
                  className="pointer-events-none absolute end-3 size-2 rounded-full bg-primary group-hover/tab:hidden"
                />
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t('Close {{name}}', { name })}
                className={cn(
                  'absolute end-1.5 size-5 text-muted-foreground sm:size-5',
                  (!isActive || isDirty) &&
                    'opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100'
                )}
                onClick={() => (isDirty ? setClosingTab(tab) : closeTab(tab.key))}
              >
                <XIcon className="size-3.5 sm:size-3.5" />
              </Button>
            </div>
          );
        })}
      </TabsList>
      {closingTab && (
        <CloseTabDialog
          name={getTabName(closingTab)}
          onCancel={() => setClosingTab(null)}
          onDiscard={() => {
            closeTab(closingTab.key);
            setClosingTab(null);
          }}
        />
      )}
    </>
  );
};
