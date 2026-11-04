import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { WorkspaceTabsProvider } from '@/lib/workspace/contexts/workspace-tabs-provider';
import { useWorkspaceTabs } from '@/lib/workspace/hooks/use-workspace-tabs';
import { SidebarProvider } from '@/shared/components/ui/sidebar';

import { render } from '../../../../../tests/render';

import { FilesTab } from './files-tab';

vi.mock('@/lib/api/fetcher');

const CONNECTION_ID = 'connection-1';

const TOP_CUSTOMERS = {
  id: 'file-1',
  name: 'top_customers',
  type: 'SQL',
  content: 'select 1',
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
};

const NOTES = {
  id: 'file-2',
  name: 'notes',
  type: 'TXT',
  content: 'hello',
  updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
};

type Files = unknown[] | Promise<never> | Error;

const mockApi = ({
  files = [TOP_CUSTOMERS, NOTES] as Files,
  save = {} as unknown,
  remove = { apiErrors: [], success: true } as unknown
} = {}) =>
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();
    if (query.includes('mutation SaveFile')) return { saveFile: save };
    if (query.includes('mutation RemoveFile')) return { removeFile: remove };

    const value = await files;
    if (value instanceof Error) throw value;
    return { files: { items: value } };
  });

const getCalls = (name: string) =>
  vi.mocked(gqlFetcher).mock.calls.filter(([document]) => document.toString().includes(name));

const OpenTabs = () => {
  const { tabs, activeKey } = useWorkspaceTabs();

  return (
    <ul aria-label="tabs">
      {tabs.map(tab => (
        <li key={tab.key} aria-current={tab.key === activeKey}>
          {tab.kind === 'file'
            ? `${tab.key} ${tab.name}.${tab.type}`
            : `${tab.kind} ${'type' in tab && tab.type}`}
        </li>
      ))}
    </ul>
  );
};

const renderFiles = (search = '') =>
  render(
    <WorkspaceTabsProvider connectionId={CONNECTION_ID}>
      <SidebarProvider>
        <FilesTab connectionId={CONNECTION_ID} search={search} />
        <OpenTabs />
      </SidebarProvider>
    </WorkspaceTabsProvider>
  );

const getOpenTabs = () =>
  within(screen.getByRole('list', { name: 'tabs', hidden: true }))
    .queryAllByRole('listitem', { hidden: true })
    .map(item => item.textContent);

const openRowMenu = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: `Acciones de ${name}` }));
};

describe('FilesTab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('lists the files of the connection with their extension, age and count', async () => {
    mockApi();

    renderFiles();

    expect(await screen.findByRole('button', { name: /^top_customers\.sql/ })).toHaveTextContent(
      '2d'
    );
    expect(screen.getByRole('button', { name: /^notes\.txt/ })).toHaveTextContent('3h');
    expect(screen.getByText('Guardados')).toHaveTextContent('2');
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), { connectionId: CONNECTION_ID });
  });

  test('shows a loading state', async () => {
    mockApi({ files: new Promise<never>(() => {}) });

    renderFiles();

    expect(
      await screen.findByRole('status', { name: 'Cargando los archivos' })
    ).toBeInTheDocument();
  });

  test('shows an error and retries', async () => {
    mockApi({ files: new Error('network') });

    renderFiles();
    expect(await screen.findByText('No pudimos cargar tus archivos')).toBeInTheDocument();

    mockApi();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByRole('button', { name: /^notes\.txt/ })).toBeInTheDocument();
  });

  test('shows the empty state with the action to create the first file', async () => {
    mockApi({ files: [] });

    renderFiles();
    const user = userEvent.setup();
    expect(
      await screen.findByText('Aquí aparecen los archivos que guardes en esta conexión.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Nuevo archivo' }));
    await user.click(await screen.findByRole('menuitem', { name: 'SQL' }));

    expect(getOpenTabs()).toEqual(['draft sql']);
  });

  test('opens a text draft from New file without calling the api', async () => {
    mockApi();

    renderFiles();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Nuevo archivo' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Texto' }));

    expect(getOpenTabs()).toEqual(['draft txt']);
    expect(getCalls('mutation SaveFile')).toEqual([]);
  });

  test('filters by name and shows a message without results', async () => {
    mockApi();

    const { unmount } = renderFiles('NOTES');

    expect(await screen.findByRole('button', { name: /^notes\.txt/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^top_customers/ })).not.toBeInTheDocument();

    unmount();
    renderFiles('payments');

    expect(await screen.findByText('Sin resultados para “payments”')).toBeInTheDocument();
  });

  test('opens a file in a single tab', async () => {
    mockApi();

    renderFiles();
    const user = userEvent.setup();
    const row = await screen.findByRole('button', { name: /^notes\.txt/ });
    await user.click(row);
    await user.click(row);

    expect(getOpenTabs()).toEqual(['file:file-2 notes.txt']);
  });

  test('marks a file with unsaved changes', async () => {
    localStorage.setItem(
      `dbiewer:tabs:${CONNECTION_ID}`,
      JSON.stringify({
        tabs: [
          {
            key: 'file:file-2',
            kind: 'file',
            fileId: 'file-2',
            name: 'notes',
            type: 'txt',
            isDirty: true
          }
        ],
        activeKey: 'file:file-2',
        provisionalKey: null
      })
    );
    mockApi();

    renderFiles();

    const row = await screen.findByRole('button', { name: /^notes\.txt/ });
    expect(within(row).getByRole('img', { name: 'Cambios sin guardar' })).toBeInTheDocument();
  });

  test('renames a file, keeps its content and updates its tab', async () => {
    mockApi({ save: { apiErrors: [], file: { ...NOTES, name: 'ideas' } } });

    renderFiles();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^notes\.txt/ }));
    await openRowMenu(user, 'notes.txt');
    await user.click(await screen.findByRole('menuitem', { name: 'Renombrar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Renombrar archivo' });
    const input = within(dialog).getByRole('textbox', { name: 'Nombre' });
    expect(input).toHaveValue('notes');
    await user.clear(input);
    await user.type(input, 'ideas');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(getOpenTabs()).toEqual(['file:file-2 ideas.txt']));
    expect(getCalls('mutation SaveFile')[0]?.[1]).toEqual({
      input: {
        id: 'file-2',
        connectionId: CONNECTION_ID,
        name: 'ideas',
        type: 'TXT',
        content: 'hello'
      }
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('shows the repeated name when renaming', async () => {
    mockApi({
      save: { apiErrors: [{ code: 'FILE_NAME_ALREADY_EXISTS', message: 'Taken' }], file: null }
    });

    renderFiles();
    const user = userEvent.setup();
    await openRowMenu(user, 'notes.txt');
    await user.click(await screen.findByRole('menuitem', { name: 'Renombrar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Renombrar archivo' });
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(
      await within(dialog).findByText('Ya tienes un archivo con este nombre')
    ).toBeInTheDocument();
  });

  test('deletes a file after confirming and closes its tab', async () => {
    mockApi();

    renderFiles();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^notes\.txt/ }));
    await openRowMenu(user, 'notes.txt');
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar notes.txt?' });
    expect(getCalls('mutation RemoveFile')).toEqual([]);

    mockApi({ files: [TOP_CUSTOMERS] });
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(getOpenTabs()).toEqual([]));
    expect(getCalls('mutation RemoveFile')[0]?.[1]).toEqual({ id: 'file-2' });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^notes\.txt/ })).not.toBeInTheDocument()
    );
  });

  test('does not delete a file when canceling', async () => {
    mockApi();

    renderFiles();
    const user = userEvent.setup();
    await openRowMenu(user, 'notes.txt');
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getCalls('mutation RemoveFile')).toEqual([]);
  });

  test('shows the error in the dialog when the file cannot be deleted', async () => {
    mockApi({
      remove: { apiErrors: [{ code: 'FILE_NOT_FOUND', message: 'Not found' }], success: null }
    });

    renderFiles();
    const user = userEvent.setup();
    await openRowMenu(user, 'notes.txt');
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    expect(await within(dialog).findByText('Este archivo ya no existe')).toBeInTheDocument();
  });
});
