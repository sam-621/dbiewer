import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';

import { SqlTab } from './sql-tab';

vi.mock('@/lib/api/fetcher');

const TAB_KEY = 'draft:1';
const DRAFT_STORAGE_KEY = `dbiewer:draft:connection-1:${TAB_KEY}`;

const EXECUTION = {
  columns: [
    { name: 'id', type: 'integer' },
    { name: 'email', type: 'text' }
  ],
  rows: [
    ['1', 'ana@acme.dev'],
    ['2', null]
  ],
  rowCount: 2,
  isTruncated: false,
  durationMs: 12,
  command: 'SELECT 2'
};

const SCHEMAS = [
  {
    name: 'public',
    tables: [
      {
        name: 'users',
        columns: [
          { name: 'id', type: 'integer', isPrimaryKey: true, isForeignKey: false },
          { name: 'email', type: 'text', isPrimaryKey: false, isForeignKey: false }
        ]
      }
    ],
    views: [],
    functions: []
  }
];

const isSchemaQuery = (document: { toString: () => string }) =>
  document.toString().includes('query GetConnectionSchema');

const mockRun = (result: unknown) =>
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    if (isSchemaQuery(document)) return { connectionSchema: { apiErrors: [], schemas: SCHEMAS } };

    const value = await result;
    if (value instanceof Error) throw value;
    return value;
  });

const mockExecution = (execution: Partial<typeof EXECUTION> = {}) =>
  mockRun({ runQuery: { apiErrors: [], execution: { ...EXECUTION, ...execution } } });

const getRunInputs = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => !isSchemaQuery(document))
    .map(([, variables]) => (variables as { input: Record<string, unknown> }).input);

const getSuggestions = () => screen.queryAllByRole('option').map(option => option.textContent);

const waitForCompletionDelay = () => new Promise(resolve => setTimeout(resolve, 100));

const renderTab = (sql = 'select id, email from users;\nselect 2;') => {
  localStorage.setItem(DRAFT_STORAGE_KEY, sql);

  return render(
    <div className="h-96">
      <SqlTab connectionId="connection-1" connectionName="Acme prod" tabKey={TAB_KEY} />
    </div>
  );
};

describe('SqlTab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    mockRun(null);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('renders the stored draft, the connection and the not run state', () => {
    renderTab();

    expect(screen.getByRole('textbox', { name: 'Editor SQL' })).toHaveTextContent(
      'select id, email from users;select 2;'
    );
    expect(screen.getByText('Acme prod')).toBeInTheDocument();
    expect(
      screen.getByText('Ejecuta la consulta con Ctrl↵ para ver los resultados aquí')
    ).toBeInTheDocument();
  });

  test('runs the statement under the cursor and shows its rows', async () => {
    mockExecution();

    renderTab();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(await screen.findByText('ana@acme.dev')).toBeInTheDocument();
    expect(getRunInputs()).toEqual([
      { connectionId: 'connection-1', sql: 'select id, email from users' }
    ]);
    expect(screen.getByText('2 filas · 12 ms')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /email/ })).toBeInTheDocument();
    expect(screen.getAllByRole('row')[2]).toHaveTextContent('NULL');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('runs with the keyboard shortcut', async () => {
    mockExecution();

    renderTab('select 1');
    const user = userEvent.setup();
    await user.click(screen.getByRole('textbox', { name: 'Editor SQL' }));
    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() =>
      expect(getRunInputs()).toEqual([{ connectionId: 'connection-1', sql: 'select 1' }])
    );
  });

  test('shows the running state and disables Run', async () => {
    mockRun(new Promise<never>(() => {}));

    renderTab();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(
      await screen.findByRole('status', { name: 'Ejecutando la consulta' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ejecutar/ })).toBeDisabled();
  });

  test('shows the truncation notice', async () => {
    mockExecution({ isTruncated: true, rowCount: 5000 });

    renderTab();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(
      await screen.findByText('El resultado se cortó en las primeras 1000 filas.')
    ).toBeInTheDocument();
    expect(screen.getByText('5000 filas · 12 ms')).toBeInTheDocument();
  });

  test('shows the command tag when the statement returns no rows', async () => {
    mockExecution({ columns: [], rows: [], rowCount: 3, command: 'UPDATE 3' });

    renderTab("update users set plan = 'pro'");
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(await screen.findByText('UPDATE 3')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('shows the Postgres message when the query fails', async () => {
    mockRun({
      runQuery: {
        apiErrors: [{ code: 'QUERY_FAILED', message: 'relation "userz" does not exist' }],
        execution: null
      }
    });

    renderTab('select * from userz');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(await screen.findByText('La consulta falló')).toBeInTheDocument();
    expect(screen.getByText('relation "userz" does not exist')).toBeInTheDocument();
  });

  test('shows a generic error when the request fails', async () => {
    mockRun(new Error('network'));

    renderTab();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Ejecutar/ }));

    expect(await screen.findByText('Algo salió mal')).toBeInTheDocument();
  });

  test('formats the SQL and keeps it as the draft', async () => {
    renderTab('select id from users where id=1');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Formatear' }));

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe(
      'SELECT\n  id\nFROM\n  users\nWHERE\n  id = 1'
    );
    expect(getRunInputs()).toEqual([]);
  });

  test('suggests the tables and columns of the connection', async () => {
    renderTab('');
    const user = userEvent.setup();
    const editor = screen.getByRole('textbox', { name: 'Editor SQL' });

    await user.click(editor);
    await user.keyboard('select * from us');

    await waitFor(() => expect(getSuggestions()).toContain('users'));

    await waitForCompletionDelay();
    await user.keyboard('{Enter}');
    await user.keyboard(' u where u.em');
    await waitFor(() => expect(getSuggestions()[0]).toBe('email'));
    await waitForCompletionDelay();
    await user.keyboard('{Tab}');

    await waitFor(() =>
      expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBe('select * from users u where u.email')
    );
  });
});
