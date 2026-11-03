import type { ReactNode } from 'react';

import { UserMenu } from '@/lib/account/components/user-menu/user-menu';
import { Brand } from '@/shared/components/brand';

import { ActiveConnectionProvider } from '../../contexts/active-connection-provider';

import { ConnectionSelector } from './connection-selector/connection-selector';

type Props = { hasConnections?: boolean; children: ReactNode };

export const WorkspaceLayout = ({ hasConnections = false, children }: Props) => (
  <ActiveConnectionProvider>
    <main className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-stretch justify-between gap-4 border-b ps-4">
        <div className="flex min-w-0 items-center gap-4">
          <Brand />
          {hasConnections && <ConnectionSelector />}
        </div>
        <UserMenu />
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </main>
  </ActiveConnectionProvider>
);
