import { describe, expect, test } from 'vitest';

import { DIAGRAM_TAB_KEY } from '../constants/workspace-tabs';

import {
  closeTab,
  EMPTY_WORKSPACE_TABS,
  getRemovedTabKeys,
  openDiagramTab,
  openTab
} from './workspace-tabs.utils';

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

describe('openDiagramTab', () => {
  test('adds the tab with its fixed key and keeps the provisional tab', () => {
    const current = openTab(EMPTY_WORKSPACE_TABS, USERS, { isPinned: false });

    const next = openDiagramTab(current);

    expect(next.tabs.map(tab => tab.key)).toEqual(['table:public.users', DIAGRAM_TAB_KEY]);
    expect(next.activeKey).toBe(DIAGRAM_TAB_KEY);
    expect(next.provisionalKey).toBe('table:public.users');
  });

  test('activates the tab when it is already open', () => {
    const opened = openDiagramTab(EMPTY_WORKSPACE_TABS);
    const current = openTab(opened, USERS, { isPinned: true });

    const next = openDiagramTab(current);

    expect(next.tabs).toHaveLength(2);
    expect(next.activeKey).toBe(DIAGRAM_TAB_KEY);
  });
});
