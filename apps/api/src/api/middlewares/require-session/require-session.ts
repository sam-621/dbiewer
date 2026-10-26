import type { ResolverFn } from '@/api/codegen';
import type { RequestContext, Session } from '@/context';
import { UnauthenticatedError } from '@/errors/account-errors';

export type SessionContext = RequestContext & { session: Session };

const hasSession = (ctx: RequestContext): ctx is SessionContext => ctx.session !== null;

export const requireSession =
  <TResult, TParent, TArgs>(
    resolver: ResolverFn<TResult, TParent, SessionContext, TArgs>
  ): ResolverFn<TResult, TParent, RequestContext, TArgs> =>
  async (parent, args, ctx, info) => {
    if (!hasSession(ctx)) throw new UnauthenticatedError();

    return resolver(parent, args, ctx, info);
  };
