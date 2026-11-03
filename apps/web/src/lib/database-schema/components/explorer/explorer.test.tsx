import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { SidebarProvider } from '@/shared/components/ui/sidebar';

import { render } from '../../../../../tests/render';

import { Explorer } from './explorer';

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

const renderExplorer = (search = '') =>
  render(
    <SidebarProvider>
      <Explorer connectionId="connection-1" search={search} />
    </SidebarProvider>
  );

describe('Explorer', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
    expect(screen.getByText('monthly_revenue')).toBeInTheDocument();
  });

  test('does not show the empty groups', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByRole('button', { name: /^Funciones/ })).toHaveTextContent('1');
    expect(screen.queryByRole('button', { name: /^Vistas/ })).not.toBeInTheDocument();
  });

  test('shows the columns with their type and keys when expanding a table', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();
    const user = userEvent.setup();
    expect(screen.queryByText('workspace_id')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'users' }));

    expect(screen.getByText('workspace_id')).toBeInTheDocument();
    expect(screen.getByText('varchar(255)')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Llave primaria' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Llave foránea' })).toBeInTheDocument();
  });

  test('shows the functions with their arguments', async () => {
    mockSchema(schemaResult([PUBLIC]));

    renderExplorer();

    expect(await screen.findByText('refresh_stats(since date)')).toBeInTheDocument();
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

    expect(await screen.findByText('users')).toBeInTheDocument();
  });

  test('shows a generic error when the request fails', async () => {
    mockSchema(new Error('Network error'));

    renderExplorer();

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });
});
