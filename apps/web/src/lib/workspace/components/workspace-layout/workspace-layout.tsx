import type { ReactNode } from 'react';

import { UserMenu } from '@/lib/account/components/user-menu/user-menu';
import { Brand } from '@/shared/components/brand';

import { ActiveConnectionProvider } from '../../contexts/active-connection-provider';

import { ConnectionSelector } from './connection-selector/connection-selector';

type Props = { hasConnections?: boolean; children: ReactNode };

export const WorkspaceLayout = ({ hasConnections = false, children }: Props) => (
  <ActiveConnectionProvider>
    <main className="flex h-svh flex-col bg-shell">
      <header className="flex h-11 shrink-0 items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <Brand />
          {hasConnections && <ConnectionSelector />}
        </div>
        <UserMenu />
      </header>
      {hasConnections ? (
        children
      ) : (
        <div className="mx-1.5 mb-1.5 flex min-h-0 flex-1 flex-col overflow-auto rounded-shell bg-background">
          {children}
        </div>
      )}
    </main>
  </ActiveConnectionProvider>
);
