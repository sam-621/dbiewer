import type { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { Providers } from '@/app/providers';
import { gqlFetcher } from '@/lib/api/fetcher';

import { ActiveConnectionProvider } from '../contexts/active-connection-provider';

import { useActiveConnection } from './use-active-connection';

vi.mock('@/lib/api/fetcher');

const STORAGE_KEY = 'dbiewer:active-connection';

const createConnection = (id: string, name: string) => ({
  id,
  name,
  host: `${id}.acme.dev`,
  port: 5432,
  database: 'acme',
  username: 'ana',
  hasPassword: true,
  sslMode: 'REQUIRE'
});

const NEWEST = createConnection('connection-2', 'Acme prod');
const OLDEST = createConnection('connection-1', 'Acme staging');

const wrapper = ({ children }: { children: ReactNode }) => (
  <Providers queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ActiveConnectionProvider>{children}</ActiveConnectionProvider>
  </Providers>
);

const renderActiveConnection = async () => {
  const hook = renderHook(() => useActiveConnection(), { wrapper });
  await waitFor(() => expect(hook.result.current.connections).toHaveLength(2));
  return hook;
};

describe('useActiveConnection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockResolvedValue({ connections: { items: [NEWEST, OLDEST] } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('uses the most recent connection when none was stored', async () => {
    const { result } = await renderActiveConnection();

    expect(result.current.activeConnection?.id).toBe(NEWEST.id);
  });

  test('uses the stored connection', async () => {
    localStorage.setItem(STORAGE_KEY, OLDEST.id);

    const { result } = await renderActiveConnection();

    expect(result.current.activeConnection?.id).toBe(OLDEST.id);
  });

  test('uses the most recent connection when the stored one no longer exists', async () => {
    localStorage.setItem(STORAGE_KEY, 'connection-removed');

    const { result } = await renderActiveConnection();

    expect(result.current.activeConnection?.id).toBe(NEWEST.id);
  });

  test('stores the selected connection', async () => {
    const { result } = await renderActiveConnection();

    act(() => result.current.setActiveConnection(OLDEST.id));

    expect(result.current.activeConnection?.id).toBe(OLDEST.id);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(OLDEST.id);
  });

  test('shares the active connection between its consumers', async () => {
    const { result } = renderHook(
      () => ({ selector: useActiveConnection(), sidebar: useActiveConnection() }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.sidebar.connections).toHaveLength(2));

    act(() => result.current.selector.setActiveConnection(OLDEST.id));

    expect(result.current.sidebar.activeConnection?.id).toBe(OLDEST.id);
  });

  test('keeps working when localStorage fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });

    const { result } = await renderActiveConnection();
    expect(result.current.activeConnection?.id).toBe(NEWEST.id);

    act(() => result.current.setActiveConnection(OLDEST.id));
    expect(result.current.activeConnection?.id).toBe(OLDEST.id);
  });
});
