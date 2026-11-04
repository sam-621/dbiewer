import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { WorkspaceTabsProvider } from '../contexts/workspace-tabs-provider';

import { useWorkspaceTabs } from './use-workspace-tabs';

const USERS = { kind: 'table', schema: 'public', name: 'users' } as const;
const ORDERS = { kind: 'table', schema: 'public', name: 'orders' } as const;
const REVENUE = { kind: 'view', schema: 'billing', name: 'revenue' } as const;
const REFRESH = {
  kind: 'function',
  schema: 'public',
  name: 'refresh_stats',
  arguments: 'since date'
} as const;
const REFRESH_KEY = 'function:public.refresh_stats(since date)';
const USERS_KEY = 'table:public.users';
const NOTES = { id: 'file-1', name: 'notes', type: 'txt' } as const;

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

const storeDraftTab = (fields: Record<string, unknown> = {}) =>
  localStorage.setItem(
    'dbiewer:tabs:connection-1',
    JSON.stringify({
      tabs: [{ key: 'draft:1', kind: 'draft', number: 1, ...fields }],
      activeKey: 'draft:1',
      provisionalKey: null
    })
  );

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
        where: '',
        orderBy: '',
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

  test('opens a function in the provisional tab and replaces it with another object', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openObject(REFRESH, { isPinned: false }));

    expect(result.current.tabs).toEqual([{ key: REFRESH_KEY, ...REFRESH }]);
    expect(result.current.activeKey).toBe(REFRESH_KEY);
    expect(result.current.provisionalKey).toBe(REFRESH_KEY);

    act(() => result.current.openObject(USERS, { isPinned: false }));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);
  });

  test('keeps a tab per overload of a function', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(REFRESH, { isPinned: true }));
    act(() => result.current.openObject({ ...REFRESH, arguments: '' }, { isPinned: true }));

    expect(tabKeys(result.current.tabs)).toEqual([REFRESH_KEY, 'function:public.refresh_stats()']);
  });

  test('pins a provisional function tab', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(REFRESH, { isPinned: false }));
    act(() => result.current.pinTab(REFRESH_KEY));
    act(() => result.current.openObject(USERS, { isPinned: false }));

    expect(tabKeys(result.current.tabs)).toEqual([REFRESH_KEY, 'table:public.users']);
    expect(result.current.provisionalKey).toBe('table:public.users');
  });

  test('restores function tabs next to the stored tabs of other kinds', () => {
    localStorage.setItem(
      'dbiewer:tabs:connection-1',
      JSON.stringify({
        tabs: [
          {
            key: 'table:public.users',
            ...USERS,
            state: { view: 'data', where: '', orderBy: '', page: 1 }
          },
          { key: 'draft:1', kind: 'draft', number: 1 }
        ],
        activeKey: 'draft:1',
        provisionalKey: null
      })
    );

    const { result, unmount } = renderTabs();
    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users', 'draft:1']);

    act(() => result.current.openObject(REFRESH, { isPinned: false }));
    unmount();

    const { result: restored } = renderTabs();
    expect(restored.current.tabs.at(-1)).toEqual({ key: REFRESH_KEY, ...REFRESH });
    expect(restored.current.provisionalKey).toBe(REFRESH_KEY);
  });

  test('opens new files as pinned draft tabs with increasing numbers', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openDraft('sql'));
    act(() => result.current.openDraft('txt'));

    const [, first, second] = result.current.tabs;
    expect(first).toMatchObject({ kind: 'draft', number: 1, type: 'sql' });
    expect(second).toMatchObject({ kind: 'draft', number: 2, type: 'txt' });
    expect(first?.key).toMatch(/^draft:[\w-]+$/);
    expect(result.current.activeKey).toBe(second?.key);
    expect(result.current.provisionalKey).toBe('table:public.users');

    act(() => result.current.openObject(ORDERS, { isPinned: false }));
    expect(tabKeys(result.current.tabs)).toEqual(['table:public.orders', first?.key, second?.key]);
  });

  test('restores draft tabs and removes the draft SQL when closing one', () => {
    const key = 'draft:1';
    storeDraftTab();
    localStorage.setItem(`dbiewer:draft:connection-1:${key}`, 'select 1');

    const { result } = renderTabs();
    expect(result.current.tabs).toEqual([
      { key, kind: 'draft', number: 1, type: 'sql', isDirty: false }
    ]);

    act(() => result.current.closeTab(key));

    expect(result.current.tabs).toEqual([]);
    expect(localStorage.getItem(`dbiewer:draft:connection-1:${key}`)).toBeNull();
  });

  test('counts a stored draft without a type as sql', () => {
    localStorage.setItem(
      'dbiewer:tabs:connection-1',
      JSON.stringify({
        tabs: [{ key: 'draft:1', kind: 'draft', number: 1 }],
        activeKey: 'draft:1',
        provisionalKey: null
      })
    );

    const { result } = renderTabs();

    expect(result.current.tabs).toEqual([
      { key: 'draft:1', kind: 'draft', number: 1, type: 'sql', isDirty: false }
    ]);
  });

  test('opens a file once in a pinned tab', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.openFile(NOTES));
    act(() => result.current.activateTab(USERS_KEY));
    act(() => result.current.openFile(NOTES));

    expect(tabKeys(result.current.tabs)).toEqual([USERS_KEY, 'file:file-1']);
    expect(result.current.activeKey).toBe('file:file-1');
    expect(result.current.provisionalKey).toBe(USERS_KEY);
  });

  test('turns a draft into a file tab keeping its type', () => {
    const draftKey = 'draft:1';
    storeDraftTab({ type: 'txt' });

    const { result } = renderTabs();
    act(() => result.current.changeTabDirty(draftKey, true));
    act(() => result.current.replaceDraftTab(draftKey, { id: 'file-1', name: 'notes' }));

    expect(result.current.tabs).toEqual([
      {
        key: 'file:file-1',
        kind: 'file',
        fileId: 'file-1',
        name: 'notes',
        type: 'txt',
        isDirty: false,
        draftKey
      }
    ]);
    expect(result.current.activeKey).toBe('file:file-1');
  });

  test('renames a file tab and keeps the change after restoring it', () => {
    const { result, unmount } = renderTabs();

    act(() => result.current.openFile(NOTES));
    act(() => result.current.renameFileTab('file:file-1', 'ideas'));
    unmount();

    const { result: restored } = renderTabs();
    expect(restored.current.tabs[0]).toMatchObject({ name: 'ideas' });
  });

  test('marks a tab with unsaved changes and restores the mark', () => {
    const { result, unmount } = renderTabs();

    act(() => result.current.openFile(NOTES));
    act(() => result.current.changeTabDirty('file:file-1', true));
    unmount();

    const { result: restored } = renderTabs();
    expect(restored.current.tabs[0]).toMatchObject({ isDirty: true });
  });

  test('removes the unsaved content when closing a file tab', () => {
    const { result } = renderTabs();

    act(() => result.current.openFile(NOTES));
    localStorage.setItem('dbiewer:draft:connection-1:file:file-1', 'unsaved');
    act(() => result.current.closeTab('file:file-1'));

    expect(localStorage.getItem('dbiewer:draft:connection-1:file:file-1')).toBeNull();
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

  test('pins the provisional tab when choosing its columns', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: false }));
    act(() => result.current.changeHiddenColumns(USERS_KEY, ['email']));

    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual(['email']);
    expect(result.current.provisionalKey).toBeNull();
  });

  test('keeps the hidden columns when changing tabs and connections', () => {
    const { result, changeConnection } = renderTabsFor('connection-1');

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.openObject(ORDERS, { isPinned: true }));
    act(() => result.current.changeHiddenColumns(USERS_KEY, ['email']));
    act(() => result.current.activateTab('table:public.orders'));
    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual(['email']);
    expect(result.current.getHiddenColumns('table:public.orders')).toEqual([]);

    changeConnection('connection-2');
    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual([]);

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.changeHiddenColumns(USERS_KEY, ['plan']));

    changeConnection('connection-1');
    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual(['email']);

    changeConnection('connection-2');
    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual(['plan']);
  });

  test('forgets the hidden columns when closing the tab', () => {
    const { result } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.openObject(ORDERS, { isPinned: true }));
    act(() => result.current.changeHiddenColumns(USERS_KEY, ['email']));
    act(() => result.current.changeHiddenColumns('table:public.orders', ['total']));
    act(() => result.current.closeTab(USERS_KEY));
    act(() => result.current.openObject(USERS, { isPinned: true }));

    expect(result.current.getHiddenColumns(USERS_KEY)).toEqual([]);
    expect(result.current.getHiddenColumns('table:public.orders')).toEqual(['total']);
  });

  test('does not keep the hidden columns in localStorage', () => {
    const { result, unmount } = renderTabs();

    act(() => result.current.openObject(USERS, { isPinned: true }));
    act(() => result.current.changeHiddenColumns(USERS_KEY, ['secret_column']));

    expect(JSON.stringify({ ...localStorage })).not.toContain('secret_column');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret_column');

    unmount();
    const { result: restored } = renderTabs();
    expect(tabKeys(restored.current.tabs)).toEqual([USERS_KEY]);
    expect(restored.current.getHiddenColumns(USERS_KEY)).toEqual([]);
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
    act(() => result.current.openFile(NOTES));
    act(() => result.current.closeTab(result.current.activeKey ?? ''));

    expect(tabKeys(result.current.tabs)).toEqual(['table:public.users']);
  });
});
