import type { ReactNode } from 'react';

import { SessionUser } from '@/lib/account/components/session-user/session-user';
import { Brand } from '@/shared/components/brand';

export const WorkspaceLayout = ({ children }: { children: ReactNode }) => (
  <main className="flex min-h-svh flex-col">
    <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
      <Brand />
      <SessionUser />
    </header>
    {children}
  </main>
);
