import type { Resolvers } from '@/api/codegen';
import { requireSession } from '@/api/middlewares/require-session';
import { apiResponse } from '@/api/utils/api-response';
import { UnitOfWork } from '@/persistence/unit-of-work';
import { WorkspaceForUserCreator } from '@/use-cases/workspace-for-user-creator';

export const AccountResolver: Resolvers = {
  Mutation: {
    createWorkspace: async (_parent, args, ctx) => {
      const session = requireSession(ctx);

      const uow = new UnitOfWork(ctx.database, ctx.rlsContext);

      const result = await uow.execute(async (_repositories, uowCtx) => {
        const workspaceForUserCreator = new WorkspaceForUserCreator(uowCtx);

        return workspaceForUserCreator.execute({
          ownerUserId: session.user.id,
          name: args.input.name
        });
      });

      return apiResponse(result, 'workspace');
    }
  }
};
