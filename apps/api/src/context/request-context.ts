import type { YogaInitialContext } from 'graphql-yoga';

import { WorkspaceNotFoundError } from '@/errors/workspace-errors';
import type { Database } from '@/persistence/database';
import type { Workspace } from '@/persistence/repositories/workspace';
import type { RLSContext } from '@/persistence/rls';
import { UnitOfWork } from '@/persistence/unit-of-work';
import type { Auth } from '@/services/auth';

import type { AppContext } from './app-context';

export type SessionUser = Auth['$Infer']['Session']['user'];

export type Session = {
  user: SessionUser;
  workspace: Workspace;
};

export type RequestContext = {
  database: Database;
  rlsContext: RLSContext;
  services: AppContext['services'];
  session: Session | null;
};

const resolveSession = async (
  appContext: AppContext,
  auth: Auth,
  headers: Headers
): Promise<Session | null> => {
  const authSession = await auth.api.getSession({ headers });

  if (!authSession) return null;

  const workspace = await new UnitOfWork(appContext.databases.app).execute(repositories =>
    repositories.workspace.findByOwnerUserId(authSession.user.id)
  );

  if (!workspace) throw new WorkspaceNotFoundError(authSession.user.id);

  return { user: authSession.user, workspace };
};

export const createRequestContext =
  (appContext: AppContext, auth: Auth) =>
  async ({ request }: YogaInitialContext): Promise<RequestContext> => {
    const session = await resolveSession(appContext, auth, request.headers);

    return {
      database: appContext.databases.app,
      rlsContext: { tenantId: session?.workspace.id ?? null },
      services: appContext.services,
      session
    };
  };
