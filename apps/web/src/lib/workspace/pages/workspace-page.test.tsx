import { Route, Routes } from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { authClient } from '@/lib/api/auth-client';
import { gqlFetcher } from '@/lib/api/fetcher';
import { Protect } from '@/shared/guards/protect';

import { render } from '../../../../tests/render';

import { WorkspacePage } from './workspace-page';

vi.mock('@/lib/api/fetcher');
vi.mock('@/lib/api/auth-client', () => ({
  authClient: { signOut: vi.fn() }
}));

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

type Connections = (typeof CONNECTION)[] | Error | Promise<never>;

const signOut = vi.mocked(authClient.signOut);

let me: typeof ME | null = ME;

const mockApi = (connections: Connections = []) => {
  me = ME;

  vi.mocked(gqlFetcher).mockImplementation(async document => {
    if (document.toString().includes('query GetMe')) return { me };

    const result = await connections;
    if (result instanceof Error) throw result;
    return { connections: { items: result } };
  });
};

const renderPage = () =>
  render(
    <Routes>
      <Route path="/login" element={<p>Login</p>} />
      <Route path="/connections/new" element={<p>New connection form</p>} />
      <Route element={<Protect />}>
        <Route path="/" element={<WorkspacePage />} />
      </Route>
    </Routes>
  );

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    signOut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shows the empty state with the signed in user when there are no connections', async () => {
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
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('ana@acme.dev')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  test('goes to the new connection form from the empty state', async () => {
    mockApi();

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('link', { name: 'Nueva conexión' }));

    expect(await screen.findByText('New connection form')).toBeInTheDocument();
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

    mockApi();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(
      await screen.findByRole('heading', { name: 'Conecta tu primera base de datos' })
    ).toBeInTheDocument();
  });

  test('renders the workspace name when there are connections', async () => {
    mockApi([CONNECTION]);

    renderPage();

    expect(await screen.findByRole('heading', { name: "Ana's workspace" })).toBeInTheDocument();
    expect(screen.queryByText('Conecta tu primera base de datos')).not.toBeInTheDocument();
  });

  test('signs out and redirects to login', async () => {
    mockApi();
    signOut.mockImplementation(async () => {
      me = null;
      return { data: { success: true }, error: null };
    });

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });

  test('shows a generic error when sign out fails', async () => {
    mockApi();
    signOut.mockRejectedValue(new Error('Network error'));

    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
