import { describe, expect, test } from 'vitest';

import type { RequestContext, Session } from '@/context';
import { UnauthenticatedError } from '@/errors/account-errors';

import { requireSession } from './require-session';

const session = {
  user: { id: crypto.randomUUID(), name: 'Ada', email: 'ada@example.com' },
  workspace: { id: crypto.randomUUID(), name: "Ada's workspace" }
} as unknown as Session;

describe('requireSession - Middleware', () => {
  test('returns the session of the context', () => {
    const context = { session } as unknown as RequestContext;

    expect(requireSession(context)).toBe(session);
  });

  test('throws UnauthenticatedError when the context has no session', () => {
    const context = { session: null } as unknown as RequestContext;

    expect(() => requireSession(context)).toThrow(UnauthenticatedError);
  });
});
