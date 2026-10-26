import type {
  MutationCreateWorkspaceArgs,
  MutationUpdateUserProfileArgs,
  Resolvers
} from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import type { RequestContext } from '@/context';
import { UserProfileUpdater } from '@/modules/user/use-cases/user-profile-updater';
import { WorkspaceForUserCreator } from '@/modules/workspace/use-cases/workspace-for-user-creator';
import { UnitOfWork } from '@/persistence/unit-of-work';

function me(_parent: unknown, _args: unknown, ctx: RequestContext) {
  return ctx.session;
}

async function createWorkspace(
  _parent: unknown,
  args: MutationCreateWorkspaceArgs,
  ctx: SessionContext
) {
  const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

  const result = await uow.execute(async (_repositories, uowCtx) => {
    const workspaceForUserCreator = new WorkspaceForUserCreator(uowCtx);

    return workspaceForUserCreator.execute({
      ownerUserId: ctx.session.user.id,
      name: args.input.name
    });
  });

  return apiResponse(result, 'workspace');
}

async function updateUserProfile(
  _parent: unknown,
  args: MutationUpdateUserProfileArgs,
  ctx: SessionContext
) {
  const userProfileUpdater = new UserProfileUpdater(ctx.auth);

  const result = await userProfileUpdater.execute({
    user: ctx.session.user,
    headers: ctx.headers,
    name: args.input.name
  });

  return apiResponse(result, 'user');
}

export const AccountResolver: Resolvers = {
  Query: {
    me
  },
  Mutation: {
    createWorkspace: requireSession(createWorkspace),
    updateUserProfile: requireSession(updateUserProfile)
  }
};
