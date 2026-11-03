import { Route, Routes } from 'react-router';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { Protect } from '@/shared/guards/protect';

import { render } from '../../../../tests/render';

import { WorkspacePage } from './workspace-page';

vi.mock('@/lib/api/fetcher');

const ME = {
  user: { id: 'user-1', name: 'Ana', email: 'ana@acme.dev', image: null },
  workspace: { id: 'workspace-1', name: "Ana's workspace" }
};

const CONNECTION = {
  id: 'connection-1',
  name: 'Acme prod',
  host: 'db.acme.dev',
  port: 5432,
  database: 'acme_prod',
  username: 'ana',
  hasPassword: true,
  sslMode: 'REQUIRE'
};

const STAGING = {
  ...CONNECTION,
  id: 'connection-0',
  name: 'Acme staging',
  host: 'staging.acme.dev'
};

const createSchema = (table: string) => ({
  name: 'public',
  tables: [{ name: table, columns: [] }],
  views: [],
  functions: []
});

type Connections = (typeof CONNECTION)[] | Error | Promise<never>;
type Schemas = Record<string, ReturnType<typeof createSchema>[]>;

const mockApi = (
  connections: Connections = [],
  removeConnection: unknown = null,
  schemas: Schemas = {}
) => {
  vi.mocked(gqlFetcher).mockImplementation(async (document, variables) => {
    if (document.toString().includes('query GetMe')) return { me: ME };
    if (document.toString().includes('mutation RemoveConnection')) return { removeConnection };

    const connectionId = (variables as { connectionId?: string } | undefined)?.connectionId;
    if (connectionId) {
      const connectionSchemas = schemas[connectionId];
      if (!connectionSchemas) return new Promise<never>(() => {});
      return { connectionSchema: { apiErrors: [], schemas: connectionSchemas } };
    }

    const result = await connections;
    if (result instanceof Error) throw result;
    return { connections: { items: result } };
  });
};

const renderPage = () =>
  render(
    <Routes>
      <Route element={<Protect />}>
        <Route path="/" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );

describe('WorkspacePage', () => {
  beforeEach(() => {
    localStorage.removeItem('dbiewer:active-connection');
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shows the empty state when there are no connections', async () => {
    mockApi();

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Conecta tu primera base de datos' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Necesitas una conexión Postgres para explorar su esquema y ejecutar consultas.'
      )
    ).toBeInTheDocument();
  });

  test('shows the brand and the signed in user in the header without actions', async () => {
    mockApi();

    renderPage();

    const header = await screen.findByRole('banner');
    expect(await within(header).findByText('Ana')).toBeInTheDocument();
    expect(within(header).getByText('dbiewer')).toBeInTheDocument();
    expect(within(header).getByText('ana@acme.dev')).toBeInTheDocument();
    expect(within(header).queryByRole('button')).not.toBeInTheDocument();
  });

  test('opens the new connection dialog from the empty state', async () => {
    mockApi();

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Nueva conexión' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Nueva conexión' })).toBeInTheDocument();
  });

  test('shows a loading state while the connections load', async () => {
    mockApi(new Promise<never>(() => {}));

    renderPage();

    await waitFor(() =>
      expect(
        vi
          .mocked(gqlFetcher)
          .mock.calls.some(([document]) => !document.toString().includes('GetMe'))
      ).toBe(true)
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  test('shows an error and retries loading the connections', async () => {
    mockApi(new Error('Network error'));

    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'No pudimos cargar tus conexiones' })
    ).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('dbiewer')).toBeInTheDocument();

    mockApi();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(
      await screen.findByRole('heading', { name: 'Conecta tu primera base de datos' })
    ).toBeInTheDocument();
  });

  test('shows the shell without tabs when there are connections', async () => {
    mockApi([CONNECTION], null, { [CONNECTION.id]: [createSchema('users')] });

    renderPage();

    expect(await screen.findByText('users')).toBeInTheDocument();
    expect(
      screen.getByText('Abre una tabla desde el explorador para ver sus datos.')
    ).toBeInTheDocument();
    const header = screen.getByRole('banner');
    expect(within(header).getByText('dbiewer')).toBeInTheDocument();
    expect(within(header).getByRole('button', { name: /Acme prod/ })).toBeInTheDocument();
    expect(screen.queryByText('Conecta tu primera base de datos')).not.toBeInTheDocument();
  });

  test('removes the last connection from the header and shows the empty state', async () => {
    mockApi([CONNECTION], null, { [CONNECTION.id]: [createSchema('users')] });

    renderPage();
    const user = userEvent.setup();
    await user.click(
      await within(await screen.findByRole('banner')).findByRole('button', { name: /Acme prod/ })
    );
    await user.hover(await screen.findByRole('menuitem', { name: 'Eliminar conexión' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Acme prod' }));
    const dialog = await screen.findByRole('alertdialog');

    mockApi([], { apiErrors: [], success: true });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    expect(
      await screen.findByRole('heading', { name: 'Conecta tu primera base de datos' })
    ).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), { connectionId: 'connection-1' });
  });

  test('shows the schema of the connection selected in the header', async () => {
    mockApi([CONNECTION, STAGING], null, {
      [CONNECTION.id]: [createSchema('users')],
      [STAGING.id]: [createSchema('events')]
    });

    renderPage();
    const user = userEvent.setup();
    expect(await screen.findByText('users')).toBeInTheDocument();

    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /Acme prod/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Acme staging/ }));

    expect(await screen.findByText('events')).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
  });
});
