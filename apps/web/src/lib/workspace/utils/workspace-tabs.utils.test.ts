import { describe, expect, test } from 'vitest';

import { closeTab, EMPTY_WORKSPACE_TABS, getRemovedTabKeys, openTab } from './workspace-tabs.utils';

const USERS = { kind: 'table', schema: 'public', name: 'users' } as const;
const ORDERS = { kind: 'table', schema: 'public', name: 'orders' } as const;

describe('getRemovedTabKeys', () => {
  test('returns the provisional tab that gets replaced', () => {
    const current = openTab(EMPTY_WORKSPACE_TABS, USERS, { isPinned: false });
    const next = openTab(current, ORDERS, { isPinned: false });

    expect(getRemovedTabKeys(current, next)).toEqual(['table:public.users']);
  });

  test('returns the closed tab and nothing when no tab goes away', () => {
    const current = openTab(EMPTY_WORKSPACE_TABS, USERS, { isPinned: true });

    expect(getRemovedTabKeys(current, closeTab(current, 'table:public.users'))).toEqual([
      'table:public.users'
    ]);
    expect(getRemovedTabKeys(current, openTab(current, ORDERS, { isPinned: true }))).toEqual([]);
  });
});
