import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronRightIcon } from '@/shared/components/icons/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/shared/components/ui/breadcrumb';
import { cn } from '@/shared/utils/cn';

import { useTabName } from '../../../hooks/use-tab-name';
import { useWorkspaceTabs } from '../../../hooks/use-workspace-tabs';
import type { WorkspaceTab } from '../../../utils/workspace-tabs.utils';

type Props = { connection: { name: string; host: string; port: number } };

export const WorkspaceStatusBar = ({ connection }: Props) => {
  const { t } = useTranslation();
  const { tabs, activeKey } = useWorkspaceTabs();
  const getTabName = useTabName();
  const activeTab = tabs.find(tab => tab.key === activeKey);

  const getTabPath = (tab: WorkspaceTab) => {
    if (tab.kind === 'draft') return [`${getTabName(tab)}.${tab.type}`];
    return tab.kind === 'file' ? [getTabName(tab)] : [tab.schema, getTabName(tab)];
  };

  const path = [connection.name, ...(activeTab ? getTabPath(activeTab) : [])];

  return (
    <footer className="flex h-7.5 shrink-0 items-center justify-between gap-3 px-3.5 text-xs text-muted-foreground">
      <Breadcrumb aria-label={t('Location')} className="min-w-0">
        <BreadcrumbList className="flex-nowrap gap-1.5 text-xs whitespace-nowrap sm:gap-1.5">
          {path.map((segment, index) => {
            const isLast = index === path.length - 1;

            return (
              <Fragment key={index}>
                <BreadcrumbItem className={cn('min-w-0', index > 0 && 'font-mono')}>
                  {isLast ? (
                    <BreadcrumbPage className="truncate">{segment}</BreadcrumbPage>
                  ) : (
                    <span className="truncate">{segment}</span>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator className="[&>svg]:size-3">
                    <ChevronRightIcon />
                  </BreadcrumbSeparator>
                )}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <span className="shrink-0 font-mono max-sm:hidden">
        {connection.host}:{connection.port}
      </span>
    </footer>
  );
};
