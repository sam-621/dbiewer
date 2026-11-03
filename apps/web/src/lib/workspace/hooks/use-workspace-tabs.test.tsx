import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { WorkspaceTabsProvider } from '../contexts/workspace-tabs-provider';

import { useWorkspaceTabs } from './use-workspace-tabs';

const USERS = { kind: 'table', schema: 'public', name: 'users' } as const;
const ORDERS = { kind: 'table', schema: 'public', name: 'orders' } as const;
const REVENUE = { kind: 'view', schema: 'billing', name: 'revenue' } as const;

const renderTabsFor = (initialConnectionId: string) => {
  let connectionId = initialConnectionId;
  const hook = renderHook(() => useWorkspaceTabs(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <WorkspaceTabsProvider connectionId={connectionId}>{children}</WorkspaceTabsProvider>
    )
  });

  const changeConnection = (nextConnectionId: string) => {
    connectionId = nextConnectionId;
    hook.rerender();
  };

  return { ...hook, changeConnection };
};

const renderTabs = (connectionId = 'connection-1') => renderTabsFor(connectionId);

const tabKeys = (tabs: { key: string }[]) => tabs.map(tab => tab.key);

describe('useWorkspaceTabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('opens an object in the provisional tab and activates it', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);
    expect(result.current.activeKey).toBe('table:public.users');
    expect(result.current.provisionalKey).toBe('table:public.users');
  });

  test('replaces the provisional tab when opening another object', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    act(() => result.current.openObject(REVENUE, { isPinned: false }));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users', 'view:billing.revenue']);
    expect(result.current.activeKey).toBe('view:billing.revenue');
    expect(result.current.provisionalKey).toBe('view:billing.revenue');
  });

  test('activates an object that is already open', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    act(() => result.current.openObject(USERS, { isPinned: false }));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users', 'table:public.orders']);
    expect(result.current.activeKey).toBe('table:public.users');
    expect(result.current.provisionalKey).toBe('table:public.orders');
  });

  test('pins the provisional tab when opening it pinned, pinning it or changing its state', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openObject(USERS, { isPinned: true }));
    expect(result.current.provisionalKey).toBeNull();

    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    act(() => result.current.pinTab('table:public.orders'));
    expect(result.current.provisionalKey).toBeNull();

    act(() => result.current.openObject(REVENUE, { isPinned: false }));
    act(() =>
      result.current.changeTabState('view:billing.revenue', {
        view: 'structure',
        filters: [],
        orderBy: null,
        page: 1
      })
    );
    expect(result.current.provisionalKey).toBeNull();
    expect(result.current.tabs[2]).toMatchObject({ state: { view: 'structure' } });
    expect(result.current.tabs).toHaveLength(3);
  });

  test('closes a tab and activates its neighbor', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.openObject(ORDERS, { isPinned: true }));
    act(() => result.current.closeTab('table:public.orders'));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);
    expect(result.current.activeKey).toBe('table:public.users');

    act(() => result.current.closeTab('table:public.users'));

    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeKey).toBeNull();
  });

  test('does not open functions', () => {
    const { result } = renderTabs();

    act(() =>
      result.current.openObject(
        { kind: 'function', schema: 'public', name: 'refresh_stats', arguments: '' },
        { isPinned: false }
      )
    );

    expect(result.current.tabs).toEqual([]);
  });

  test('opens new queries as pinned draft tabs with increasing numbers', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openDraft());
    act(() => result.current.openDraft());

    const [, first, second] = result.current.tabs;
    expect(first).toMatchObject({ kind: 'draft', number: 1 });
    expect(second).toMatchObject({ kind: 'draft', number: 2 });
    expect(first?.key).toMatch(/^draft:[\w-]+$/);
    expect(result.current.activeKey).toBe(second?.key);
    expect(result.current.provisionalKey).toBe('table:public.users');

    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    expect(tabKeys(result.current.tabs)).toEqual(['table:public.orders', first?.key, second?.key]);
  });

  test('restores draft tabs and removes the draft SQL when closing one', () => {
    const { result, unmount } = renderTabs();

    act(() => result.current.openDraft());
    const key = result.current.activeKey ?? '';
    localStorage.setItem(`dbiewer:draft:connection-1:${key}`, 'select 1');

    unmount();
    const { result: restored } = renderTabs();
    expect(restored.current.tabs).toEqual([{ key, kind: 'draft', number: 1 }]);

    act(() => restored.current.closeTab(key));

    expect(restored.current.tabs).toEqual([]);
    expect(localStorage.getItem(`dbiewer:draft:connection-1:${key}`)).toBeNull();
  });

  test('keeps the tabs of each connection in localStorage', () => {
    const { result, changeConnection, unmount } = renderTabsFor('connection-1');

    act(() => result.current.openObject(USERS, { isPinned: true }));
    changeConnection('connection-2');
    expect(result.current.tabs).toEqual([]);

    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    changeConnection('connection-1');
    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);

    unmount();
    const { result: restored } = renderTabs('connection-2');
    expect(tabKeys(restored.current.tabs)).toEqual(['table:public.orders']);
    expect(restored.current.provisionalKey).toBe('table:public.orders');
    expect(JSON.parse(localStorage.getItem('dbiewer:tabs:connection-1') ?? '')).toMatchObject({
      activeKey: 'table:public.users'
    });
  });

  test('starts without tabs when the stored value is not valid', () => {
    localStorage.setItem('dbiewer:tabs:connection-1', '{"tabs":"oops"}');

    const { result } = renderTabs();

    expect(result.current.tabs).toEqual([]);
  });

  test('keeps working without tabs when localStorage fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderTabs();
    expect(result.current.tabs).toEqual([]);

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openDraft());
    act(() => result.current.closeTab(result.current.activeKey ?? ''));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);
  });
});
