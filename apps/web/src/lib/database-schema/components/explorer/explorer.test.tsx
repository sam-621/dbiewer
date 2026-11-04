import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { SidebarProvider } from '@/shared/components/ui/sidebar';

import { render } from '../../../../../tests/render';
import { useExplorerExpanded } from '../../hooks/use-explorer-expanded';
import { ExplorerCollapseButton } from '../explorer-collapse-button/explorer-collapse-button';

import { Explorer } from './explorer';
import type { OpenExplorerObject } from './explorer-object';

vi.mock('@/lib/api/fetcher');

const column = (name: string, type: string, keys: Partial<Record<'pk' | 'fk', boolean>> = {}) => ({
  name,
  type,
  isPrimaryKey: keys.pk ?? false,
  isForeignKey: keys.fk ?? false
});

const PUBLIC = {
  name: 'public',
  tables: [
    {
      name: 'users',
      columns: [
        column('id', 'uuid', { pk: true }),
        column('workspace_id', 'uuid', { fk: true }),
        column('email', 'character varying(255)')
      ]
    },
    { name: 'audit_log', columns: [] }
  ],
  views: [],
  functions: [{ name: 'refresh_stats', arguments: 'since date', kind: 'FUNCTION' }]
};

const BILLING = {
  name: 'billing',
  tables: [{ name: 'invoices', columns: [] }],
  views: [{ name: 'monthly_revenue', columns: [column('month', 'date')] }],
  functions: []
};

const mockSchema = (result: unknown) => {
  vi.mocked(gqlFetcher).mockImplementation(async () => {
    const value = await result;
    if (value instanceof Error) throw value;
    return value;
  });
};

const schemaResult = (schemas: unknown[]) => ({ connectionSchema: { apiErrors: [], schemas } });

const onOpenObject = vi.fn<OpenExplorerObject>();

const STORAGE_KEY = 'dbiewer:explorer-expanded:connection-1';

const storeExpanded = (ids: string[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

const getStoredExpanded = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

type TestExplorerProps = {
  connectionId?: string;
  search?: string;
  activeTabKey?: string;
};

const TestExplorer = ({
  connectionId = 'connection-1',
  search = '',
  activeTabKey
}: TestExplorerProps) => {
  const { expandedIds, changeExpanded, collapseAll } = useExplorerExpanded(connectionId);

  return (
    <SidebarProvider>
      <ExplorerCollapseButton onCollapse={collapseAll} />
      <Explorer
        connectionId={connectionId}
        search={search}
        expandedIds={expandedIds}
        onExpandedChange={changeExpanded}
        activeTabKey={activeTabKey}
        onOpenObject={onOpenObject}
      />
    </SidebarProvider>
  );
};

const SwitchableExplorer = ({ initialSearch = '' }: { initialSearch?: string }) => {
  const [connectionId, setConnectionId] = useState('connection-1');
  const [search, setSearch] = useState(initialSearch);

  return (
    <>
      <button onClick={() => setConnectionId('connection-1')}>First connection</button>
      <button onClick={() => setConnectionId('connection-2')}>Second connection</button>
      <button onClick={() => setSearch('')}>Clear search</button>
      <TestExplorer connectionId={connectionId} search={search} />
    </>
  );
};

const renderExplorer = (search = '') => render(<TestExplorer search={search} />);

describe('Explorer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    onOpenObject.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows a loading state while the schema loads', async () => {
    mockSchema(new Promise<never>(() => {}));

    renderExplorer();

    expect(await screen.findByRole('status', { name: 'Cargando el esquema' })).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), { connectionId: 'connection-1' });
  });

  test('does not show the schema level when there is only one schema', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: /^Tablas/ })).toHaveTextContent('2');
    expect(screen.queryByRole('button', { name: 'public' })).not.toBeInTheDocument();
  });

  test('shows a level per schema when there are several', async () => {
    mockSchema(schemaResult([PUBLIC, BILLING]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: 'public' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'billing' })).toBeInTheDocument();
  });

  test('starts with every schema collapsed', async () => {
    mockSchema(schemaResult([PUBLIC, BILLING]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: 'public' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByRole('button', { name: /^Tablas/ })).not.toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  test('starts with the groups collapsed when there is only one schema', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: /^Tablas/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /^Funciones/ })).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  test('remembers what was expanded after mounting again', async () => {
    mockSchema(schemaResult([PUBLIC, BILLING]));

    const { unmount } = renderExplorer();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'public' }));
    await user.click(screen.getByRole('button', { name: /^Tablas/ }));
    await user.click(screen.getByRole('button', { name: 'Columnas de users' }));
    expect(screen.getByText('workspace_id')).toBeInTheDocument();

    unmount();
    renderExplorer();

    expect(await screen.findByText('workspace_id')).toBeInTheDocument();
    expect(screen.queryByText('invoices')).not.toBeInTheDocument();
  });

  test('forgets what was contracted', async () => {
    storeExpanded(['group:public.tables', 'group:public.functions']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^Tablas/ }));

    expect(getStoredExpanded()).toEqual(['group:public.functions']);
  });

  test('keeps what is expanded apart for each connection', async () => {
    storeExpanded(['group:public.tables']);
    mockSchema(schemaResult([PUBLIC]));

    render(<SwitchableExplorer />);
    const user = userEvent.setup();
    expect(await screen.findByText('users')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Second connection' }));
    expect(await screen.findByRole('button', { name: /^Tablas/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    await user.click(screen.getByRole('button', { name: 'First connection' }));
    expect(await screen.findByText('users')).toBeInTheDocument();
  });

  test('ignores the stored ids that no longer exist', async () => {
    storeExpanded(['table:public.deleted', 'group:public.tables']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByText('users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Funciones/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('starts collapsed when the stored value is invalid', async () => {
    localStorage.setItem(STORAGE_KEY, '{"invalid":');
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: /^Tablas/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('starts collapsed and still expands when localStorage fails', async () => {
    const fail = () => {
      throw new Error('Storage unavailable');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: /^Tablas/ }));

    expect(screen.getByText('users')).toBeInTheDocument();
  });

  test('expands the groups with results without changing what is stored', async () => {
    storeExpanded(['group:public.functions']);
    mockSchema(schemaResult([PUBLIC]));

    render(<SwitchableExplorer initialSearch="users" />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^Tablas/ }));

    expect(screen.getByText('users')).toBeInTheDocument();
    expect(getStoredExpanded()).toEqual(['group:public.functions']);

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('button', { name: /^Tablas/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /^Funciones/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('does not show the empty groups', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: /^Funciones/ })).toHaveTextContent('1');
    expect(screen.queryByRole('button', { name: /^Vistas/ })).not.toBeInTheDocument();
  });

  test('shows the columns with their type and keys when expanding a table', async () => {
    storeExpanded(['group:public.tables']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();
    expect(screen.queryByText('workspace_id')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Columnas de users' }));

    expect(screen.getByText('workspace_id')).toBeInTheDocument();
    expect(screen.getByText('varchar(255)')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Llave primaria' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Llave foránea' })).toBeInTheDocument();
  });

  test('marks the object of the active tab', async () => {
    storeExpanded(['group:public.tables']);
    mockSchema(schemaResult([PUBLIC]));

    render(<TestExplorer activeTabKey="table:public.users" />);

    expect(await screen.findByRole('button', { name: 'users' })).toHaveAttribute(
      'data-active',
      'true'
    );
  });

  test('does not expand anything for the active tab', async () => {
    mockSchema(schemaResult([PUBLIC]));

    render(<TestExplorer activeTabKey="table:public.users" />);

    expect(await screen.findByRole('button', { name: /^Tablas/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  test('collapses schemas, groups, tables and views with collapse all', async () => {
    storeExpanded([
      'schema:public',
      'group:public.tables',
      'schema:billing',
      'group:billing.views'
    ]);
    mockSchema(schemaResult([PUBLIC, BILLING]));

    renderExplorer();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Columnas de users' }));
    await user.click(screen.getByRole('button', { name: 'monthly_revenue' }));
    expect(screen.getByText('workspace_id')).toBeInTheDocument();
    expect(screen.getByText('month')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Contraer todo' }));

    expect(getStoredExpanded()).toEqual([]);
    expect(screen.getByRole('button', { name: 'public' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'billing' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^Tablas/ })).not.toBeInTheDocument()
    );
    expect(screen.queryByText('users')).not.toBeInTheDocument();
    expect(screen.queryByText('monthly_revenue')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'public' }));
    expect(screen.getByRole('button', { name: /^Tablas/ })).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });

  test('collapses the groups of a single schema with collapse all', async () => {
    storeExpanded(['group:public.tables']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();
    expect(await screen.findByText('users')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Contraer todo' }));

    expect(screen.getByRole('button', { name: /^Tablas/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('users')).not.toBeInTheDocument());
    expect(getStoredExpanded()).toEqual([]);
  });

  test('keeps the groups with results expanded when collapsing during a search', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer('users');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Columnas de users' }));
    expect(screen.getByText('workspace_id')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Contraer todo' }));

    expect(screen.getByText('users')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('workspace_id')).not.toBeInTheDocument());
  });

  test('shows the functions with their arguments', async () => {
    storeExpanded(['group:public.functions']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByText('refresh_stats(since date)')).toBeInTheDocument();
  });

  test('opens a function in the provisional tab with a click', async () => {
    storeExpanded(['group:public.functions']);
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'refresh_stats(since date)' }));

    expect(onOpenObject).toHaveBeenCalledWith(
      { kind: 'function', schema: 'public', name: 'refresh_stats', arguments: 'since date' },
      { isPinned: false }
    );
  });

  test('shows a message when the search has no results', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer('orders');

    expect(await screen.findByText('Sin resultados para “orders”')).toBeInTheDocument();
  });

  test('shows a message when the database has no objects', async () => {
    mockSchema(schemaResult([]));

    renderExplorer();

    expect(
      await screen.findByText('Esta base de datos no tiene tablas, vistas ni funciones')
    ).toBeInTheDocument();
  });

  test('shows the connection error and retries', async () => {
    mockSchema({
      connectionSchema: {
        apiErrors: [{ code: 'CONNECTION_FAILED', message: 'ECONNREFUSED' }],
        schemas: null
      }
    });

    renderExplorer();
    expect(
      await screen.findByText('No pudimos conectarnos a la base de datos')
    ).toBeInTheDocument();

    mockSchema(schemaResult([PUBLIC]));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByRole('button', { name: /^Tablas/ })).toBeInTheDocument();
  });

  test('shows a generic error when the request fails', async () => {
    mockSchema(new Error('Network error'));

    renderExplorer();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });
});
