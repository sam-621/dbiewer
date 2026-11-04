import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';
import { WorkspaceTabsProvider } from '@/lib/workspace/contexts/workspace-tabs-provider';
import { useWorkspaceTabs } from '@/lib/workspace/hooks/use-workspace-tabs';
import type { DraftTab, FileTab } from '@/lib/workspace/utils/workspace-tabs.utils';

import { render } from '../../../../../tests/render';
import { FileEditorTab } from '../file-editor-tab/file-editor-tab';

vi.mock('@/lib/api/fetcher');

const CONNECTION_ID = 'connection-1';
const TABS_STORAGE_KEY = `dbiewer:tabs:${CONNECTION_ID}`;
const DRAFT_KEY = 'draft:1';
const DRAFT_STORAGE_KEY = `dbiewer:draft:${CONNECTION_ID}:${DRAFT_KEY}`;
const FILE_STORAGE_KEY = `dbiewer:draft:${CONNECTION_ID}:file:file-1`;

const FILE = {
  id: 'file-1',
  name: 'notes',
  type: 'TXT',
  content: 'first line',
  updatedAt: '2026-11-01T12:00:00.000Z'
};

const DRAFT_TAB: DraftTab = {
  key: DRAFT_KEY,
  kind: 'draft',
  number: 1,
  type: 'txt',
  isDirty: false
};

const FILE_TAB: FileTab = {
  key: 'file:file-1',
  kind: 'file',
  fileId: 'file-1',
  name: 'notes',
  type: 'txt',
  isDirty: false
};

const getSaveInputs = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('mutation SaveFile'))
    .map(([, variables]) => (variables as { input: Record<string, unknown> }).input);

const mockApi = ({ file = FILE as unknown, save = {} as unknown } = {}) =>
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();
    if (query.includes('query GetFiles')) return { files: { items: [] } };
    if (query.includes('mutation SaveFile')) return { saveFile: save };

    const value = await file;
    if (value instanceof Error) throw value;
    return { file: value };
  });

const ActiveTab = () => {
  const { tabs, activeKey } = useWorkspaceTabs();
  const tab = tabs.find(({ key }) => key === activeKey);

  if (tab?.kind !== 'draft' && tab?.kind !== 'file') return null;

  return (
    <>
      <p data-testid="tab-key">{tab.key}</p>
      <FileEditorTab
        key={tab.kind === 'file' && tab.draftKey ? tab.draftKey : tab.key}
        connectionId={CONNECTION_ID}
        connectionName="Acme prod"
        tab={tab}
      />
    </>
  );
};

const renderTab = (tab: DraftTab | FileTab) => {
  localStorage.setItem(
    TABS_STORAGE_KEY,
    JSON.stringify({ tabs: [tab], activeKey: tab.key, provisionalKey: null })
  );

  return render(
    <WorkspaceTabsProvider connectionId={CONNECTION_ID}>
      <ActiveTab />
    </WorkspaceTabsProvider>
  );
};

const getEditor = () => screen.findByRole('textbox', { name: 'Editor de texto' });

describe('TextTab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders the file with Save and without Run, Format or results', async () => {
    mockApi();

    renderTab(FILE_TAB);

    expect(await getEditor()).toHaveValue('first line');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ejecutar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Formatear' })).not.toBeInTheDocument();
    expect(screen.queryByText('Resultados')).not.toBeInTheDocument();
  });

  test('shows a loading state while the file loads', async () => {
    mockApi({ file: new Promise<never>(() => {}) });

    renderTab(FILE_TAB);

    expect(await screen.findByRole('status', { name: 'Cargando el archivo' })).toBeInTheDocument();
  });

  test('shows an empty state when the file no longer exists', async () => {
    mockApi({ file: null });

    renderTab(FILE_TAB);

    expect(await screen.findByText('Este archivo ya no existe')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });

  test('shows an error and retries', async () => {
    mockApi({ file: new Error('network') });

    renderTab(FILE_TAB);
    expect(await screen.findByText('No pudimos cargar este archivo')).toBeInTheDocument();

    mockApi();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await getEditor()).toHaveValue('first line');
  });

  test('keeps the unsaved changes and restores them', async () => {
    mockApi();

    const { unmount } = renderTab(FILE_TAB);
    const user = userEvent.setup();
    await user.type(await getEditor(), ' edited');
    expect(localStorage.getItem(FILE_STORAGE_KEY)).toBe('first line edited');

    unmount();
    render(
      <WorkspaceTabsProvider connectionId={CONNECTION_ID}>
        <ActiveTab />
      </WorkspaceTabsProvider>
    );

    expect(await getEditor()).toHaveValue('first line edited');
  });

  test('forgets the stored changes when the content goes back to the saved one', async () => {
    mockApi();

    renderTab(FILE_TAB);
    const user = userEvent.setup();
    const editor = await getEditor();
    await user.type(editor, '!');
    await user.type(editor, '{Backspace}');

    expect(localStorage.getItem(FILE_STORAGE_KEY)).toBeNull();
  });

  test('saves an existing file with Save without asking for the name', async () => {
    mockApi({ save: { apiErrors: [], file: { ...FILE, content: 'first line!' } } });

    renderTab(FILE_TAB);
    const user = userEvent.setup();
    await user.type(await getEditor(), '!');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(getSaveInputs()).toEqual([
        {
          id: 'file-1',
          connectionId: CONNECTION_ID,
          name: 'notes',
          type: 'TXT',
          content: 'first line!'
        }
      ])
    );
    await waitFor(() => expect(localStorage.getItem(FILE_STORAGE_KEY)).toBeNull());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('saves with the keyboard shortcut', async () => {
    mockApi({ save: { apiErrors: [], file: FILE } });

    renderTab(FILE_TAB);
    const user = userEvent.setup();
    await user.click(await getEditor());
    await user.keyboard('{Control>}s{/Control}');

    await waitFor(() => expect(getSaveInputs()).toHaveLength(1));
  });

  test('turns the draft into a file without losing the content', async () => {
    mockApi({
      file: { ...FILE, content: 'from the draft' },
      save: { apiErrors: [], file: { ...FILE, content: 'from the draft' } }
    });

    renderTab(DRAFT_TAB);
    const user = userEvent.setup();
    await user.type(await getEditor(), 'from the draft');
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe('from the draft');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Guardar archivo' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'notes');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.getByTestId('tab-key')).toHaveTextContent('file:file-1'));
    expect(getSaveInputs()).toEqual([
      { connectionId: CONNECTION_ID, name: 'notes', type: 'TXT', content: 'from the draft' }
    ]);
    expect(await getEditor()).toHaveValue('from the draft');
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('shows the invalid name in the dialog without calling the api', async () => {
    mockApi();

    renderTab(DRAFT_TAB);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Guardar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Guardar archivo' });
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(await within(dialog).findByText('Ingresa un nombre')).toBeInTheDocument();
    expect(getSaveInputs()).toEqual([]);
  });

  test('shows the repeated name in the dialog and keeps the draft', async () => {
    mockApi({
      save: {
        apiErrors: [{ code: 'FILE_NAME_ALREADY_EXISTS', message: 'Taken' }],
        file: null
      }
    });

    renderTab(DRAFT_TAB);
    const user = userEvent.setup();
    await user.type(await getEditor(), 'content');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Guardar archivo' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'notes');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    expect(
      await within(dialog).findByText('Ya tienes un archivo con este nombre')
    ).toBeInTheDocument();
    expect(screen.getByTestId('tab-key')).toHaveTextContent(DRAFT_KEY);
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe('content');
  });
});
