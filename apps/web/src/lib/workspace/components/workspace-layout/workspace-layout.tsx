import type { ReactNode } from 'react';

import { SessionUser } from '@/lib/account/components/session-user/session-user';
import { Brand } from '@/shared/components/brand';

import { ActiveConnectionProvider } from '../../contexts/active-connection-provider';

import { ConnectionSelector } from './connection-selector/connection-selector';

type Props = { hasConnections?: boolean; children: ReactNode };

export const WorkspaceLayout = ({ hasConnections = false, children }: Props) => (
  <ActiveConnectionProvider>
    <main className="flex h-svh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <Brand />
          {hasConnections && <ConnectionSelector />}
        </div>
        <SessionUser />
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </main>
  </ActiveConnectionProvider>
);
