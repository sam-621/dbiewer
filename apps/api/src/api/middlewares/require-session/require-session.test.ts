import type { GraphQLResolveInfo } from 'graphql';
import { describe, expect, test, vi } from 'vitest';

import type { RequestContext, Session } from '@/context';
import { UnauthenticatedError } from '@/errors/account-errors';

import { requireSession } from './require-session';

const session = {
  user: { id: crypto.randomUUID(), name: 'Ada', email: 'ada@example.com' },
  workspace: { id: crypto.randomUUID(), name: "Ada's workspace" }
} as unknown as Session;

const info = {} as GraphQLResolveInfo;
const args = { input: { name: 'Acme' } };

describe('requireSession - Middleware', () => {
  test('calls the resolver when the context has a session', async () => {
    const context = { session } as unknown as RequestContext;
    const resolver = vi.fn().mockResolvedValue('result');

    const result = await requireSession(resolver)({}, args, context, info);

    expect(result).toBe('result');
    expect(resolver).toHaveBeenCalledWith({}, { input: { name: 'Acme' } }, { session }, {});
  });

  test('throws UnauthenticatedError and does not call the resolver when the context has no session', async () => {
    const context = { session: null } as unknown as RequestContext;
    const resolver = vi.fn();

    await expect(requireSession(resolver)({}, args, context, info)).rejects.toThrow(
      UnauthenticatedError
    );
    expect(resolver).not.toHaveBeenCalled();
  });
});
