import type { MutationCreateWorkspaceArgs, Resolvers } from '@/api/codegen';
import type { SessionContext } from '@/api/middlewares/require-session';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { WorkspaceForUserCreator } from '@/modules/workspace/use-cases/workspace-for-user-creator';
import { UnitOfWork } from '@/persistence/unit-of-work';

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

export const AccountResolver: Resolvers = {
  Mutation: {
    createWorkspace: requireSession(createWorkspace)
  }
};
