import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';
import { ActiveConnectionProvider } from '../../contexts/active-connection-provider';

import { WorkspaceShell } from './workspace-shell';

vi.mock('@/lib/api/fetcher');

const CONNECTION = {
  id: 'connection-1',
  name: 'Acme prod',
  host: 'db.acme.dev',
  port: 5432,
  database: 'acme',
  username: 'ana',
  hasPassword: true,
  sslMode: 'REQUIRE'
};

const SCHEMAS = [
  {
    name: 'public',
    tables: [
      { name: 'users', columns: [] },
      { name: 'orders', columns: [] }
    ],
    views: [],
    functions: []
  },
  {
    name: 'billing',
    tables: [{ name: 'invoices', columns: [] }],
    views: [],
    functions: []
  }
];

const STRUCTURE = {
  columns: [{ name: 'id', type: 'uuid', isNullable: false, default: null, isPrimaryKey: true }],
  indexes: [],
  foreignKeys: [],
  definition: 'CREATE TABLE users ();'
};

const ROWS = { columns: [{ name: 'id', type: 'uuid' }], rows: [['user-1']], totalRows: 1 };

const getSchemaCalls = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('query GetConnectionSchema'));

const getTabs = () =>
  within(screen.getByRole('tablist', { name: 'Pestañas abiertas' }))
    .getAllByRole('tab')
    .map(tab => tab.textContent);

const renderShell = () =>
  render(
    <ActiveConnectionProvider>
      <WorkspaceShell />
    </ActiveConnectionProvider>
  );

describe('WorkspaceShell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    vi.mocked(gqlFetcher).mockImplementation(async (document, variables) => {
      const query = document.toString();
      if (query.includes('query GetTableStructure')) {
        return { tableStructure: { apiErrors: [], structure: STRUCTURE } };
      }
      if (query.includes('query GetTableRows')) {
        return { tableRows: { apiErrors: [], tableRows: ROWS } };
      }
      return variables
        ? { connectionSchema: { apiErrors: [], schemas: SCHEMAS } }
        : { connections: { items: [CONNECTION] } };
    });
  });

  test('renders the sidebar next to the main area', async () => {
    renderShell();

    expect(await screen.findByRole('tab', { name: 'Explorador' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Consultas' })).toBeInTheDocument();
    expect(await screen.findByText('users')).toBeInTheDocument();
    expect(
      screen.getByText('Abre una tabla desde el explorador para ver sus datos.')
    ).toBeInTheDocument();
  });

  test('changes the search placeholder and shows the empty queries on the Queries tab', async () => {
    renderShell();
    const user = userEvent.setup();
    expect(await screen.findByPlaceholderText('Buscar tablas, vistas…')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Consultas' }));

    expect(screen.getByPlaceholderText('Filtrar consultas…')).toBeInTheDocument();
    expect(screen.getByText('Sin consultas guardadas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recargar' })).not.toBeInTheDocument();
  });

  test('filters the explorer in every schema and expands the groups with results', async () => {
    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'billing' }));
    expect(screen.queryByText('invoices')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'ORDERS');
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'billing' })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Buscar tablas, vistas…'));
    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'invo');
    expect(screen.getByText('invoices')).toBeInTheDocument();
  });

  test('shows a message when the search has no results', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');

    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'payments');

    expect(screen.getByText('Sin resultados para “payments”')).toBeInTheDocument();
  });

  test('reloads the schema', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');
    expect(getSchemaCalls()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() => expect(getSchemaCalls()).toHaveLength(2));
    expect(getSchemaCalls()[1]?.[1]).toEqual({ connectionId: CONNECTION.id });
  });

  test('resizes the sidebar with the keyboard and remembers the width', async () => {
    const { unmount } = renderShell();
    const user = userEvent.setup();
    const resizer = await screen.findByRole('separator', {
      name: 'Cambiar el ancho del panel lateral'
    });
    expect(resizer).toHaveAttribute('aria-valuenow', '256');

    resizer.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    expect(resizer).toHaveAttribute('aria-valuenow', '288');
    unmount();
    renderShell();
    expect(
      await screen.findByRole('separator', { name: 'Cambiar el ancho del panel lateral' })
    ).toHaveAttribute('aria-valuenow', '288');
  });

  test('keeps the sidebar width between the limits', async () => {
    localStorage.setItem('dbiewer:sidebar-width', '2000');
    renderShell();
    const user = userEvent.setup();
    const resizer = await screen.findByRole('separator', {
      name: 'Cambiar el ancho del panel lateral'
    });
    expect(resizer).toHaveAttribute('aria-valuenow', '520');

    await user.dblClick(resizer);

    expect(resizer).toHaveAttribute('aria-valuenow', '256');
  });

  test('starts with the default width when localStorage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderShell();

    expect(
      await screen.findByRole('separator', { name: 'Cambiar el ancho del panel lateral' })
    ).toHaveAttribute('aria-valuenow', '256');
    vi.restoreAllMocks();
  });

  test('expands a table with a click without opening it', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));

    expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'users' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('opens a table in the provisional tab and replaces it with the next one', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    expect(await screen.findByRole('heading', { name: /users/ })).toBeInTheDocument();
    expect(getTabs()).toEqual(['users']);
    expect(screen.getByRole('tab', { name: 'users' })).toHaveAttribute('aria-selected', 'true');

    await user.dblClick(screen.getByRole('button', { name: 'orders' }));

    expect(await screen.findByRole('heading', { name: /orders/ })).toBeInTheDocument();
    expect(getTabs()).toEqual(['orders']);
  });

  test('pins a tab with a double click and keeps it when opening another', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('tab', { name: 'users' }));
    await user.dblClick(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
    await user.click(screen.getByRole('tab', { name: 'users' }));
    expect(await screen.findByRole('heading', { name: /users/ })).toBeInTheDocument();
  });

  test('pins the provisional tab when changing to Structure', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    await user.click(await screen.findByRole('tab', { name: 'Estructura' }));
    await user.dblClick(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
  });

  test('closes a tab without confirmation and shows the empty state', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    await user.click(await screen.findByRole('button', { name: 'Cerrar users' }));

    expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Abre una tabla desde el explorador para ver sus datos.')
    ).toBeInTheDocument();
  });

  test('restores the open tabs of the connection', async () => {
    const { unmount } = renderShell();
    const user = userEvent.setup();
    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('tab', { name: 'users' }));
    unmount();

    renderShell();

    expect(await screen.findByRole('tab', { name: 'users' })).toBeInTheDocument();
  });

  test('pins the provisional tab when opening a row detail', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.dblClick(await screen.findByRole('button', { name: 'users' }));
    const cell = await screen.findByRole('cell', { name: /user-1/ });
    await user.click(cell);
    await user.keyboard('{Escape}');
    await user.dblClick(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
  });
});
