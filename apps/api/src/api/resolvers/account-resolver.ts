import type { Resolvers } from '@/api/codegen';
import { requireSession } from '@/api/middlewares/require-session';
import { UnitOfWork } from '@/persistence/unit-of-work';
import { WorkspaceForUserCreator } from '@/use-cases/workspace-for-user-creator';

export const AccountResolver: Resolvers = {
  Mutation: {
    createWorkspace: async (_parent, args, ctx) => {
      const session = requireSession(ctx);

      return new UnitOfWork(ctx.database, ctx.rlsContext).execute((_repositories, uow) =>
        new WorkspaceForUserCreator(uow).execute({
          ownerUserId: session.user.id,
          name: args.input.name
        })
      );
    }
  }
};
