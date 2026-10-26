import { Route, Routes } from 'react-router';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { WorkspacePage } from '@/lib/workspace/pages/workspace-page';
import { Protect } from '@/shared/guards/protect';

import { render } from '../../../../../tests/render';

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

const mockApi = (
  createConnection: unknown = { apiErrors: [], connection: CONNECTION },
  testConnection: unknown = { apiErrors: [], success: true }
) => {
  let connections: (typeof CONNECTION)[] = [];

  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();

    if (query.includes('mutation TestConnection')) {
      if (testConnection instanceof Error) throw testConnection;
      return { testConnection };
    }

    if (query.includes('mutation CreateConnection')) {
      if (createConnection instanceof Error) throw createConnection;
      connections = [CONNECTION];
      return { createConnection };
    }
    if (query.includes('query GetConnections')) return { connections: { items: connections } };

    return { me: ME };
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

const openDialog = async () => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Nueva conexión' }));
  const dialog = await screen.findByRole('dialog');

  return { user, dialog };
};

const pasteUrl = async (
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  url: string
) => {
  await user.click(within(dialog).getByRole('textbox', { name: 'URL de conexión' }));
  await user.paste(url);
};

const fillForm = async () => {
  const { user, dialog } = await openDialog();

  await user.type(within(dialog).getByLabelText('Nombre'), '  Acme prod  ');
  await user.type(within(dialog).getByLabelText('Host'), 'db.acme.dev');
  await user.type(within(dialog).getByLabelText('Base de datos'), 'acme_prod');
  await user.type(within(dialog).getByLabelText('Usuario'), 'ana');

  return { user, dialog };
};

const save = (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) =>
  user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

const testButton = (dialog: HTMLElement, name = 'Probar conexión') =>
  within(dialog).getByRole('button', { name });

const createConnectionCalls = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('mutation CreateConnection'));

describe('NewConnectionDialog', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('opens the form with the engine and the connection url', async () => {
    mockApi();

    renderPage();
    const { dialog } = await openDialog();

    expect(within(dialog).getByRole('heading', { name: 'Nueva conexión' })).toBeInTheDocument();
    expect(within(dialog).getByText('PostgreSQL')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'URL de conexión' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Nombre')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Puerto')).toHaveValue('5432');
  });

  test('fills the fields and the ssl mode from a pasted url without touching the name', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText('Nombre'), 'Acme prod');
    await pasteUrl(
      user,
      dialog,
      'postgresql://ana:s%40cret@db.acme.dev:6543/acme_prod?sslmode=disable'
    );

    expect(within(dialog).getByLabelText('Nombre')).toHaveValue('Acme prod');
    expect(within(dialog).getByRole('combobox')).toHaveTextContent('Desactivado');

    expect(within(dialog).getByLabelText('Host')).toHaveValue('db.acme.dev');
    expect(within(dialog).getByLabelText('Puerto')).toHaveValue('6543');
    expect(within(dialog).getByLabelText('Base de datos')).toHaveValue('acme_prod');
    expect(within(dialog).getByLabelText('Usuario')).toHaveValue('ana');
    expect(within(dialog).getByLabelText('Contraseña')).toHaveValue('s@cret');
  });

  test('keeps the fields the url does not have', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText('Base de datos'), 'acme_prod');
    await pasteUrl(user, dialog, 'postgres://ana@db.acme.dev');

    expect(within(dialog).getByRole('combobox')).toHaveTextContent('Requerido');

    expect(within(dialog).getByLabelText('Host')).toHaveValue('db.acme.dev');
    expect(within(dialog).getByLabelText('Puerto')).toHaveValue('5432');
    expect(within(dialog).getByLabelText('Base de datos')).toHaveValue('acme_prod');
  });

  test('shows an error on the url field when the url is not valid', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    await pasteUrl(user, dialog, 'mysql://ana@db.acme.dev/acme_prod');

    expect(
      await within(dialog).findByText('Ingresa una URL de conexión válida')
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'URL de conexión' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );

    expect(within(dialog).getByLabelText('Host')).toHaveValue('');
    expect(within(dialog).getByLabelText('Usuario')).toHaveValue('');
  });

  test('saves the connection from a pasted url', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText('Nombre'), 'Acme prod');
    await pasteUrl(
      user,
      dialog,
      'postgres://ana:secret@db.acme.dev:5432/acme_prod?sslmode=verify-full'
    );
    await save(user, dialog);

    expect(await screen.findByRole('heading', { name: 'Conexiones' })).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: {
        name: 'Acme prod',
        host: 'db.acme.dev',
        port: 5432,
        database: 'acme_prod',
        username: 'ana',
        password: 'secret',
        sslMode: 'VERIFY_FULL'
      }
    });
  });

  test('keeps the url error and does not save when the url is not valid', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await fillForm();
    await pasteUrl(user, dialog, 'mysql://ana@db.acme.dev/acme_prod');
    await save(user, dialog);

    expect(
      await within(dialog).findByText('Ingresa una URL de conexión válida')
    ).toBeInTheDocument();
    expect(createConnectionCalls()).toHaveLength(0);
  });

  test('shows and hides the password', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    const password = within(dialog).getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(within(dialog).getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');

    await user.click(within(dialog).getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  test('saves the connection, closes the dialog and shows the connections list', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await fillForm();
    await user.type(within(dialog).getByLabelText('Contraseña'), ' secret ');
    await save(user, dialog);

    expect(await screen.findByRole('heading', { name: 'Conexiones' })).toBeInTheDocument();
    expect(screen.getByText('ana@db.acme.dev:5432/acme_prod')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: {
        name: 'Acme prod',
        host: 'db.acme.dev',
        port: 5432,
        database: 'acme_prod',
        username: 'ana',
        password: ' secret ',
        sslMode: 'REQUIRE'
      }
    });
  });

  test('sends no password when it is empty', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await fillForm();
    await save(user, dialog);

    expect(await screen.findByRole('heading', { name: 'Conexiones' })).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: expect.objectContaining({ password: null })
    });
  });

  test('shows validation errors on each field', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText('Nombre'), 'a'.repeat(51));
    await user.clear(within(dialog).getByLabelText('Puerto'));
    await user.type(within(dialog).getByLabelText('Puerto'), '70000');
    await save(user, dialog);

    expect(
      await within(dialog).findByText('El nombre debe tener 50 caracteres o menos')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Ingresa el host')).toBeInTheDocument();
    expect(within(dialog).getByText('El puerto debe estar entre 1 y 65535')).toBeInTheDocument();
    expect(within(dialog).getByText('Ingresa la base de datos')).toBeInTheDocument();
    expect(within(dialog).getByText('Ingresa el usuario')).toBeInTheDocument();
    expect(createConnectionCalls()).toHaveLength(0);
  });

  test('shows the repeated name error on the name field', async () => {
    mockApi({
      apiErrors: [{ code: 'CONNECTION_NAME_ALREADY_EXISTS', message: 'Already exists' }],
      connection: null
    });

    renderPage();
    const { user, dialog } = await fillForm();
    await save(user, dialog);

    expect(
      await within(dialog).findByText('Ya tienes una conexión con este nombre')
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('Algo salió mal')).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
  });

  test('shows a general error above the form when saving fails', async () => {
    mockApi(new Error('Network error'));

    renderPage();
    const { user, dialog } = await fillForm();
    await save(user, dialog);

    expect(await within(dialog).findByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes the dialog without saving on cancel', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await fillForm();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      screen.getByRole('heading', { name: 'Conecta tu primera base de datos' })
    ).toBeInTheDocument();
    expect(createConnectionCalls()).toHaveLength(0);
  });

  test('does not allow testing until host, port, database and user are filled', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await openDialog();
    expect(testButton(dialog)).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Host'), 'db.acme.dev');
    await user.type(within(dialog).getByLabelText('Base de datos'), 'acme_prod');
    expect(testButton(dialog)).toBeDisabled();

    await user.type(within(dialog).getByLabelText('Usuario'), 'ana');
    expect(testButton(dialog)).toBeEnabled();

    await user.clear(within(dialog).getByLabelText('Puerto'));
    expect(testButton(dialog)).toBeDisabled();
  });

  test('tests the connection and shows it connected for a moment', async () => {
    mockApi();

    renderPage();
    const { user, dialog } = await fillForm();
    await user.type(within(dialog).getByLabelText('Contraseña'), 'secret');
    await user.click(testButton(dialog));

    expect(await within(dialog).findByRole('button', { name: 'Conectado' })).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: {
        host: 'db.acme.dev',
        port: 5432,
        database: 'acme_prod',
        username: 'ana',
        password: 'secret',
        sslMode: 'REQUIRE'
      }
    });

    await waitFor(() => expect(testButton(dialog)).toBeInTheDocument(), { timeout: 3000 });
    expect(within(dialog).queryByRole('button', { name: 'Conectado' })).not.toBeInTheDocument();
  });

  test('shows the connection failed for a moment when it does not connect', async () => {
    mockApi(undefined, { apiErrors: [], success: false });

    renderPage();
    const { user, dialog } = await fillForm();
    await user.click(testButton(dialog));

    expect(
      await within(dialog).findByRole('button', { name: 'Falló la conexión' })
    ).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), {
      input: expect.objectContaining({ password: null })
    });

    await waitFor(() => expect(testButton(dialog)).toBeInTheDocument(), { timeout: 3000 });
  });

  test('shows the connection failed when testing throws', async () => {
    mockApi(undefined, new Error('Network error'));

    renderPage();
    const { user, dialog } = await fillForm();
    await user.click(testButton(dialog));

    expect(
      await within(dialog).findByRole('button', { name: 'Falló la conexión' })
    ).toBeInTheDocument();
  });

  test('saves the connection after a failed test', async () => {
    mockApi(undefined, { apiErrors: [], success: false });

    renderPage();
    const { user, dialog } = await fillForm();
    await user.click(testButton(dialog));
    await within(dialog).findByRole('button', { name: 'Falló la conexión' });
    await save(user, dialog);

    expect(await screen.findByRole('heading', { name: 'Conexiones' })).toBeInTheDocument();
    expect(createConnectionCalls()).toHaveLength(1);
  });
});
