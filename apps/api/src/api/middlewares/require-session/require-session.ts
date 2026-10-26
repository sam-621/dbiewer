import type { RequestContext } from '@/context';
import { UnauthenticatedError } from '@/errors/account-errors';

export const requireSession = (context: RequestContext) => {
  if (!context.session) throw new UnauthenticatedError();

  return context.session;
};
