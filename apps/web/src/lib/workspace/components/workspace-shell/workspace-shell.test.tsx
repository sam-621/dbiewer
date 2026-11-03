import { screen, waitFor } from '@testing-library/react';
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

const getSchemaCalls = () =>
  vi.mocked(gqlFetcher).mock.calls.filter(([, variables]) => variables !== undefined);

const renderShell = () =>
  render(
    <ActiveConnectionProvider>
      <WorkspaceShell>
        <p>Main area</p>
      </WorkspaceShell>
    </ActiveConnectionProvider>
  );

describe('WorkspaceShell', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    vi.mocked(gqlFetcher).mockImplementation(async (_document, variables) =>
      variables
        ? { connectionSchema: { apiErrors: [], schemas: SCHEMAS } }
        : { connections: { items: [CONNECTION] } }
    );
  });

  test('renders the sidebar next to the main area', async () => {
    renderShell();

    expect(await screen.findByRole('tab', { name: 'Explorador' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Consultas' })).toBeInTheDocument();
    expect(screen.getByText('Main area')).toBeInTheDocument();
    expect(await screen.findByText('users')).toBeInTheDocument();
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
});
