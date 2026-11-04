import { useTranslation } from 'react-i18next';

import {
  CodeIcon,
  EyeIcon,
  FileIcon,
  PlusIcon,
  TableIcon,
  XIcon
} from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { TabsList, TabsTab } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils/cn';

import { useTabName } from '../../../hooks/use-tab-name';
import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';

const TAB_ICONS = { table: TableIcon, view: EyeIcon, function: CodeIcon, draft: FileIcon };

export const WorkspaceTabBar = () => {
  const { t } = useTranslation();
  const { tabs, activeKey, provisionalKey, pinTab, closeTab, openDraft } = useWorkspaceTabs();
  const getTabName = useTabName();

  return (
    <TabsList
      variant="underline"
      aria-label={t('Open tabs')}
      className="h-11.5 w-full shrink-0 justify-start overflow-x-auto border-b px-2 data-[orientation=horizontal]:py-0 [scrollbar-width:none] *:data-[slot=tab-indicator]:hidden"
    >
      {tabs.map(tab => {
        const isActive = tab.key === activeKey;
        const Icon = TAB_ICONS[tab.kind];
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
              title={tab.kind === 'draft' ? name : `${tab.schema}.${name}`}
              className="h-full grow-0 gap-1.5 border-0 ps-2.5 pe-8 hover:bg-transparent sm:h-full"
              onDoubleClick={() => pinTab(tab.key)}
            >
              <Icon className="size-3.5" />
              <span
                className={cn('max-w-48 truncate text-xs', tab.key === provisionalKey && 'italic')}
              >
                {name}
              </span>
            </TabsTab>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Close {{name}}', { name })}
              className={cn(
                'absolute end-1.5 size-5 text-muted-foreground sm:size-5',
                !isActive && 'opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100'
              )}
              onClick={() => closeTab(tab.key)}
            >
              <XIcon className="size-3.5 sm:size-3.5" />
            </Button>
          </div>
        );
      })}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('New query')}
        className="ms-1 shrink-0"
        onClick={openDraft}
      >
        <PlusIcon />
      </Button>
    </TabsList>
  );
};
