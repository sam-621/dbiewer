import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';
import { EMPTY_TABLE_CHANGES, type TableChanges } from '../../utils/table-changes.utils';
import { DEFAULT_TABLE_VIEW_STATE, type TableViewState } from '../../utils/table-view.utils';

import { TableTab, type TableTabObject } from './table-tab';

vi.mock('@/lib/api/fetcher');

const USERS: TableTabObject = { kind: 'table', schema: 'public', name: 'users' };

const STRUCTURE = {
  columns: [
    {
      name: 'id',
      type: 'uuid',
      isNullable: false,
      default: 'gen_random_uuid()',
      isPrimaryKey: true
    },
    {
      name: 'email',
      type: 'character varying(255)',
      isNullable: false,
      default: null,
      isPrimaryKey: false
    },
    { name: 'plan', type: 'text', isNullable: true, default: null, isPrimaryKey: false }
  ],
  indexes: [
    {
      name: 'users_email_key',
      definition: 'CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)',
      isUnique: true
    }
  ],
  foreignKeys: [
    {
      columns: ['plan'],
      referencedSchema: 'billing',
      referencedTable: 'plans',
      referencedColumns: ['code'],
      onDelete: 'CASCADE'
    }
  ],
  definition: 'CREATE TABLE public.users (\n  id uuid NOT NULL\n);'
};

const ROWS = {
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'email', type: 'character varying(255)' },
    { name: 'plan', type: 'text' }
  ],
  rows: [
    ['1', 'ana@acme.dev', null],
    ['2', 'bo@acme.dev', '']
  ],
  totalRows: 120
};

const SCHEMAS = [
  {
    name: 'public',
    tables: [
      {
        name: 'users',
        columns: ['id', 'email', 'plan', 'Full Name'].map(name => ({
          name,
          type: 'text',
          isPrimaryKey: false,
          isForeignKey: false
        }))
      }
    ],
    views: [],
    functions: []
  }
];

type Result = unknown;

const mockApi = ({
  structure = { tableStructure: { apiErrors: [], structure: STRUCTURE } } as Result,
  rows = { tableRows: { apiErrors: [], tableRows: ROWS } } as Result,
  deleteRows = { deleteTableRows: { apiErrors: [], deletedRows: 1 } } as Result,
  saveChanges = { saveTableChanges: { apiErrors: [], success: true } } as Result
} = {}) => {
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();
    if (query.includes('query GetConnectionSchema')) {
      return { connectionSchema: { apiErrors: [], schemas: SCHEMAS } };
    }
    if (query.includes('mutation DeleteTableRows')) return deleteRows;
    if (query.includes('mutation SaveTableChanges')) return saveChanges;
    const result = await (query.includes('query GetTableStructure') ? structure : rows);
    if (result instanceof Error) throw result;
    return result;
  });
};

const getRowsInputs = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('query GetTableRows'))
    .map(([, variables]) => (variables as { input: Record<string, unknown> }).input);

const lastRowsInput = () => getRowsInputs().at(-1);

const getDeleteInputs = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('mutation DeleteTableRows'))
    .map(([, variables]) => (variables as { input: Record<string, unknown> }).input);

const getSaveInputs = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('mutation SaveTableChanges'))
    .map(([, variables]) => (variables as { input: Record<string, unknown> }).input);

const editCell = async (user: ReturnType<typeof userEvent.setup>, text: RegExp) => {
  await user.dblClick(screen.getByRole('cell', { name: text }));
  return screen.findByRole('textbox', { name: /^Editar/ });
};

const deleteButton = () => screen.getByRole('button', { name: 'Borrar las filas seleccionadas' });

const onStateChange = vi.fn<(state: TableViewState) => void>();

const onPin = vi.fn();

const lastState = () => onStateChange.mock.calls.at(-1)?.[0];

const Harness = ({ object }: { object: TableTabObject }) => {
  const [state, setState] = useState(DEFAULT_TABLE_VIEW_STATE);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [changes, setChanges] = useState<TableChanges>(EMPTY_TABLE_CHANGES);

  const changeState = (nextState: TableViewState) => {
    onStateChange(nextState);
    setState(nextState);
  };

  return (
    <div className="h-96">
      <TableTab
        connectionId="connection-1"
        object={object}
        state={state}
        onStateChange={changeState}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={setHiddenColumns}
        changes={changes}
        onChangesChange={setChanges}
        onPin={onPin}
      />
    </div>
  );
};

const renderTab = (object = USERS) => render(<Harness object={object} />);

const whereField = () => screen.getByRole('textbox', { name: 'WHERE' });

const orderByField = () => screen.getByRole('textbox', { name: 'ORDER BY' });

const getSuggestions = () =>
  Array.from(document.querySelectorAll('.cm-tooltip-autocomplete li')).map(
    option => option.textContent
  );

const WHERE_HISTORY_KEY = 'dbiewer:table-history:connection-1:public.users:where';

const ORDER_BY_HISTORY_KEY = 'dbiewer:table-history:connection-1:public.users:order-by';

const openColumnsMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: /^Columnas/ }));
  return screen.findByRole('dialog');
};

const getColumnHeaders = () =>
  screen.getAllByRole('columnheader', { hidden: true }).map(header => header.textContent);

const getSchemaCalls = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('query GetConnectionSchema'));

describe('TableTab', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    onPin.mockReset();
    sessionStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shows a loading state while the table loads', async () => {
    mockApi({ structure: new Promise<never>(() => {}) });

    renderTab();

    expect(await screen.findByRole('status', { name: 'Cargando la tabla' })).toBeInTheDocument();
  });

  test('renders the header and the rows with NULL distinct from an empty text', async () => {
    mockApi();

    renderTab();

    expect(await screen.findByRole('heading', { name: 'users' })).toBeInTheDocument();
    expect(await screen.findByText('120 filas')).toBeInTheDocument();
    expect(screen.getByText('ana@acme.dev')).toBeInTheDocument();
    const [, firstRow, secondRow] = screen.getAllByRole('row');
    expect(firstRow).toHaveTextContent('NULL');
    expect(secondRow).not.toHaveTextContent('NULL');
    expect(screen.getByRole('img', { name: 'Llave primaria' })).toBeInTheDocument();
    expect(screen.getByText(/1–2 de 120 · \d+ ms/)).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(lastRowsInput()).toEqual({
      connectionId: 'connection-1',
      schema: 'public',
      name: 'users',
      where: '',
      orderBy: '',
      page: 1
    });
  });

  test('shows the read only notice on a view', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [],
          structure: { ...STRUCTURE, indexes: [], foreignKeys: [], definition: 'SELECT 1' }
        }
      }
    });

    renderTab({ kind: 'view', schema: 'public', name: 'active_users' });

    expect(await screen.findByText('Vista · solo lectura')).toBeInTheDocument();
  });

  test('applies WHERE and ORDER BY with Enter and goes back to the first page', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await waitFor(() => expect(lastRowsInput()?.page).toBe(2));

    await user.click(whereField());
    await user.keyboard("  plan = 'pro'  {Enter}");

    await waitFor(() => expect(lastRowsInput()?.where).toBe("plan = 'pro'"));
    expect(lastRowsInput()?.page).toBe(1);

    await user.click(orderByField());
    await user.keyboard('2 desc{Enter}');

    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('2 desc'));
    expect(lastRowsInput()?.where).toBe("plan = 'pro'");
  });

  test('pins the tab when typing in a field', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    expect(onPin).not.toHaveBeenCalled();

    await user.click(whereField());
    await user.keyboard('1');

    expect(onPin).toHaveBeenCalled();
    expect(onStateChange).not.toHaveBeenCalled();
  });

  test('removes a filter with its action and by emptying the field', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    expect(screen.queryByRole('button', { name: 'Quitar WHERE' })).not.toBeInTheDocument();

    await user.click(whereField());
    await user.keyboard('1 = 1{Enter}');
    await waitFor(() => expect(lastRowsInput()?.where).toBe('1 = 1'));

    await user.click(screen.getByRole('button', { name: 'Quitar WHERE' }));

    await waitFor(() => expect(lastRowsInput()?.where).toBe(''));
    expect(whereField()).toHaveTextContent('');
    expect(whereField()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Quitar WHERE' })).not.toBeInTheDocument();

    await user.keyboard('2 = 2{Enter}');
    await waitFor(() => expect(lastRowsInput()?.where).toBe('2 = 2'));

    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Enter}');

    await waitFor(() => expect(lastRowsInput()?.where).toBe(''));
    expect(JSON.parse(sessionStorage.getItem(WHERE_HISTORY_KEY) ?? '[]')).toEqual([
      '2 = 2',
      '1 = 1'
    ]);
  });

  test('suggests the columns of the table from the cached schema', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await waitFor(() => expect(getSchemaCalls()).toHaveLength(1));

    await user.click(whereField());
    await user.keyboard('ema');
    await waitFor(() => expect(getSuggestions()).toContain('email'));

    await user.keyboard('{Enter}');

    await waitFor(() => expect(whereField()).toHaveTextContent('email'));
    expect(lastRowsInput()?.where).toBe('');

    await user.keyboard(' = 1 and Ful');
    await waitFor(() => expect(getSuggestions()).toContain('Full Name'));
    await user.keyboard('{Tab}');
    await waitFor(() => expect(whereField()).toHaveTextContent('email = 1 and "Full Name"'));

    expect(getSchemaCalls()).toHaveLength(1);
  });

  test('orders from the grid header writing in ORDER BY', async () => {
    mockApi({
      rows: {
        tableRows: {
          apiErrors: [],
          tableRows: {
            ...ROWS,
            columns: [...ROWS.columns.slice(0, 2), { name: 'Plan', type: 'text' }]
          }
        }
      }
    });

    renderTab();
    const user = userEvent.setup();
    expect(await screen.findByRole('columnheader', { name: /\bid uuid/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('email asc'));
    expect(orderByField()).toHaveTextContent('email asc');
    expect(screen.getByRole('columnheader', { name: /^email/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('email desc'));
    expect(orderByField()).toHaveTextContent('email desc');
    expect(screen.getByRole('columnheader', { name: /^email/ })).toHaveAttribute(
      'aria-sort',
      'descending'
    );

    await user.click(screen.getByRole('button', { name: /^Plan/ }));
    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('"Plan" asc'));
    expect(orderByField()).toHaveTextContent('"Plan" asc');
    expect(sessionStorage.getItem(ORDER_BY_HISTORY_KEY)).toBeNull();
  });

  test('shows the history of a field and applies the chosen text', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(screen.getByRole('button', { name: 'Historial de WHERE' }));
    expect(await screen.findByText('Sin historial todavía')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    await user.click(whereField());
    await user.keyboard('1 = 1{Enter}');
    await waitFor(() => expect(lastRowsInput()?.where).toBe('1 = 1'));
    await user.click(screen.getByRole('button', { name: 'Quitar WHERE' }));
    await user.keyboard('2 = 2{Enter}');
    await waitFor(() => expect(lastRowsInput()?.where).toBe('2 = 2'));
    await user.keyboard('{Enter}');

    await user.click(screen.getByRole('button', { name: 'Historial de WHERE' }));
    const items = await screen.findAllByRole('menuitem');
    expect(items.map(item => item.textContent)).toEqual(['2 = 2', '1 = 1']);

    await user.click(screen.getByRole('menuitem', { name: '1 = 1' }));

    await waitFor(() => expect(lastRowsInput()?.where).toBe('1 = 1'));
    expect(whereField()).toHaveTextContent('1 = 1');
  });

  test('keeps at most 50 texts in the history', async () => {
    sessionStorage.setItem(
      WHERE_HISTORY_KEY,
      JSON.stringify(Array.from({ length: 50 }, (_, index) => `id = ${index}`))
    );
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(whereField());
    await user.keyboard('1 = 1{Enter}');

    await waitFor(() => expect(lastRowsInput()?.where).toBe('1 = 1'));
    const stored = JSON.parse(sessionStorage.getItem(WHERE_HISTORY_KEY) ?? '[]') as string[];
    expect(stored).toHaveLength(50);
    expect(stored[0]).toBe('1 = 1');
    expect(stored).not.toContain('id = 49');
  });

  test('ignores a corrupted history', async () => {
    sessionStorage.setItem(WHERE_HISTORY_KEY, '{');
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(screen.getByRole('button', { name: 'Historial de WHERE' }));

    expect(await screen.findByText('Sin historial todavía')).toBeInTheDocument();
  });

  test('paginates', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));

    await waitFor(() => expect(lastRowsInput()?.page).toBe(2));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByText('51')).toBeInTheDocument();
    expect(screen.getByText(/51–52 de 120/)).toBeInTheDocument();
  });

  test('shows the structure with columns, indexes, foreign keys and the DDL', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Estructura' }));

    expect(lastState()?.view).toBe('structure');
    expect(screen.getByText('gen_random_uuid()')).toBeInTheDocument();
    expect(
      within(screen.getByRole('tabpanel', { name: 'Estructura' })).getByText('varchar(255)')
    ).toBeInTheDocument();
    expect(screen.getByText('users_email_key')).toBeInTheDocument();
    expect(screen.getByText('Único')).toBeInTheDocument();
    expect(screen.getByText('billing.plans(code)')).toBeInTheDocument();
    expect(screen.getByText('CASCADE')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar DDL' }));

    expect(await navigator.clipboard.readText()).toBe(STRUCTURE.definition);
  });

  test('shows an empty state when the table no longer exists', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [{ code: 'OBJECT_NOT_FOUND', message: 'Not found' }],
          structure: null
        }
      }
    });

    renderTab();

    expect(await screen.findByText('Este objeto ya no existe')).toBeInTheDocument();
  });

  test('shows the connection error and retries', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [{ code: 'CONNECTION_FAILED', message: 'ECONNREFUSED' }],
          structure: null
        }
      }
    });

    renderTab();
    expect(
      await screen.findByText('No pudimos conectarnos a la base de datos')
    ).toBeInTheDocument();

    mockApi();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByText('ana@acme.dev')).toBeInTheDocument();
  });

  test('shows the Postgres message when the rows query fails', async () => {
    mockApi({
      rows: {
        tableRows: {
          apiErrors: [{ code: 'QUERY_FAILED', message: 'invalid input syntax for type uuid' }],
          tableRows: null
        }
      }
    });

    renderTab();

    expect(await screen.findByText('invalid input syntax for type uuid')).toBeInTheDocument();
    expect(whereField()).toBeInTheDocument();
    expect(orderByField()).toBeInTheDocument();
  });

  test('keeps the text and the focus when Postgres rejects the fragment', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    mockApi({
      rows: {
        tableRows: {
          apiErrors: [{ code: 'QUERY_FAILED', message: 'column "nope" does not exist' }],
          tableRows: null
        }
      }
    });
    await user.click(whereField());
    await user.keyboard('nope = 1{Enter}');

    expect(await screen.findByText('column "nope" does not exist')).toBeInTheDocument();
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();
    expect(whereField()).toHaveTextContent('nope = 1');
    expect(whereField()).toHaveFocus();

    mockApi();
    await user.keyboard('{Backspace}2{Enter}');

    expect(await screen.findByText('ana@acme.dev')).toBeInTheDocument();
    expect(lastRowsInput()?.where).toBe('nope = 2');
  });

  test('shows a message when the table has no rows', async () => {
    mockApi({
      rows: { tableRows: { apiErrors: [], tableRows: { ...ROWS, rows: [], totalRows: 0 } } }
    });

    renderTab();

    expect(await screen.findByText('Esta tabla no tiene filas')).toBeInTheDocument();
  });

  test('shows a message when no rows match the filters', async () => {
    mockApi({
      rows: { tableRows: { apiErrors: [], tableRows: { ...ROWS, rows: [], totalRows: 0 } } }
    });

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('Esta tabla no tiene filas');
    await user.click(whereField());
    await user.keyboard('1 = 2{Enter}');

    expect(await screen.findByText('Ninguna fila coincide con estos filtros')).toBeInTheDocument();
  });

  test('reloads the structure and the rows', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    const rowsCalls = getRowsInputs().length;

    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() => expect(getRowsInputs()).toHaveLength(rowsCalls + 1));
  });

  test('hides a column from the grid without closing the menu or changing the query', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    const rowsCalls = getRowsInputs().length;

    const menu = await openColumnsMenu(user);
    expect(within(menu).getByRole('checkbox', { name: /^email/ })).toBeChecked();
    expect(within(menu).getByText('varchar(255)')).toBeInTheDocument();

    await user.click(within(menu).getByRole('checkbox', { name: /^email/ }));

    expect(within(menu).getByRole('checkbox', { name: /^email/ })).not.toBeChecked();
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();
    expect(getColumnHeaders().some(header => header.startsWith('email'))).toBe(false);
    expect(screen.getByRole('button', { name: /^Columnas/, hidden: true })).toHaveTextContent(
      '2/3'
    );
    expect(screen.getByText('120 filas')).toBeInTheDocument();
    expect(getRowsInputs()).toHaveLength(rowsCalls);
  });

  test('does not let the last visible column be hidden', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    const menu = await openColumnsMenu(user);

    await user.click(within(menu).getByRole('checkbox', { name: /^email/ }));
    await user.click(within(menu).getByRole('checkbox', { name: /^plan/ }));

    expect(within(menu).getByRole('checkbox', { name: /^id/ })).toBeChecked();
    expect(within(menu).getByRole('checkbox', { name: /^id/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  test('searches columns by name and shows them all again', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    const menu = await openColumnsMenu(user);
    expect(within(menu).getByRole('button', { name: 'Mostrar todas' })).toBeDisabled();

    await user.type(within(menu).getByRole('searchbox'), 'EMA');

    expect(within(menu).getAllByRole('checkbox')).toHaveLength(1);
    await user.click(within(menu).getByRole('checkbox', { name: /^email/ }));
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();

    await user.type(within(menu).getByRole('searchbox'), 'nope');
    expect(within(menu).getByText('Sin resultados para “EMAnope”')).toBeInTheDocument();

    await user.click(within(menu).getByRole('button', { name: 'Mostrar todas' }));

    expect(await screen.findByText('ana@acme.dev')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Columnas/, hidden: true })).toHaveTextContent(
      /(\d+)\/\1/
    );
  });

  test('keeps the header order and the row keys working with hidden columns', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await openColumnsMenu(user);
    await user.click(screen.getByRole('checkbox', { name: /^id/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('email asc'));

    await editCell(user, /bo@acme\.dev/);
    await user.keyboard('x{Enter}');
    await user.click(screen.getByRole('button', { name: 'Guardar (1)' }));

    await waitFor(() => expect(getSaveInputs()).toHaveLength(1));
    expect(getSaveInputs()[0]?.updates).toEqual([
      { key: [{ column: 'id', value: '2' }], values: [{ column: 'email', value: 'bo@acme.devx' }] }
    ]);
  });

  test('shows the columns button only on Data and keeps the choice on Structure', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    const menu = await openColumnsMenu(user);
    await user.click(within(menu).getByRole('checkbox', { name: /^email/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: 'Estructura' }));
    expect(screen.queryByRole('button', { name: /^Columnas/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Datos' }));
    expect(screen.getByRole('button', { name: /^Columnas/ })).toHaveTextContent('2/3');
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();
  });

  test('selects rows from the numeral', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    expect(deleteButton()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 2' }));

    expect(screen.getByRole('button', { name: 'Seleccionar la fila 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-state', 'selected');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteButton()).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 2' }));

    expect(screen.getByRole('button', { name: 'Seleccionar la fila 2' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('deletes the selected rows after confirming and reloads the rows', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 2' }));
    const rowsCalls = getRowsInputs().length;

    await user.click(deleteButton());
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('¿Borrar 2 filas de users?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getDeleteInputs()).toEqual([
      {
        connectionId: 'connection-1',
        schema: 'public',
        name: 'users',
        keys: [[{ column: 'id', value: '1' }], [{ column: 'id', value: '2' }]]
      }
    ]);
    expect(getRowsInputs().length).toBeGreaterThan(rowsCalls);
    expect(screen.getByRole('button', { name: 'Seleccionar la fila 1' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(deleteButton()).toBeDisabled();
  });

  test('does not delete when the confirmation is cancelled', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));

    await user.click(deleteButton());
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('¿Borrar 1 fila de users?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getDeleteInputs()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Seleccionar la fila 1' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('shows the Postgres message without closing the confirmation', async () => {
    mockApi({
      deleteRows: {
        deleteTableRows: {
          apiErrors: [
            { code: 'QUERY_FAILED', message: 'violates foreign key constraint "orders_user_fk"' }
          ],
          deletedRows: null
        }
      }
    });

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));

    await user.click(deleteButton());
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    expect(
      await within(dialog).findByText('violates foreign key constraint "orders_user_fk"')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('La consulta falló')).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  test('deletes rows by every column of a composite primary key', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [],
          structure: {
            ...STRUCTURE,
            columns: STRUCTURE.columns.map(column => ({
              ...column,
              isPrimaryKey: column.name !== 'plan'
            }))
          }
        }
      }
    });

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 2' }));

    await user.click(deleteButton());
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' })
    );

    await waitFor(() => expect(getDeleteInputs()).toHaveLength(1));
    expect(getDeleteInputs()[0]?.keys).toEqual([
      [
        { column: 'id', value: '2' },
        { column: 'email', value: 'bo@acme.dev' }
      ]
    ]);
  });

  test('clears the selection when changing the page', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await user.click(screen.getByRole('button', { name: 'Página anterior' }));

    await waitFor(() => expect(lastRowsInput()?.page).toBe(1));
    expect(await screen.findByRole('button', { name: 'Seleccionar la fila 1' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(deleteButton()).toBeDisabled();
  });

  test('does not let rows be selected on a table without primary key', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [],
          structure: {
            ...STRUCTURE,
            columns: STRUCTURE.columns.map(column => ({ ...column, isPrimaryKey: false }))
          }
        }
      }
    });

    renderTab();
    await screen.findByText('ana@acme.dev');

    expect(screen.queryByRole('button', { name: /^Seleccionar la fila/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Borrar las filas seleccionadas' })
    ).not.toBeInTheDocument();
  });

  test('does not let rows be selected on a view or on Structure', async () => {
    mockApi();

    renderTab({ kind: 'view', schema: 'public', name: 'active_users' });
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    expect(screen.queryByRole('button', { name: /^Seleccionar la fila/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Borrar las filas seleccionadas' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Estructura' }));
    expect(
      screen.queryByRole('button', { name: 'Borrar las filas seleccionadas' })
    ).not.toBeInTheDocument();
  });

  test('edits a cell with double click and saves it as an update', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    const input = await editCell(user, /ana@acme\.dev/);
    expect(input).toHaveValue('ana@acme.dev');
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.keyboard('eva@acme.dev{Enter}');

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'eva@acme.dev' })).toHaveAttribute('data-changed');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const rowsCalls = getRowsInputs().length;

    await user.click(screen.getByRole('button', { name: 'Guardar (1)' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Guardar (1)' })).not.toBeInTheDocument()
    );
    expect(getSaveInputs()).toEqual([
      {
        connectionId: 'connection-1',
        schema: 'public',
        name: 'users',
        updates: [
          {
            key: [{ column: 'id', value: '1' }],
            values: [{ column: 'email', value: 'eva@acme.dev' }]
          }
        ],
        inserts: []
      }
    ]);
    expect(getRowsInputs().length).toBeGreaterThan(rowsCalls);
    expect(screen.queryByRole('button', { name: 'Deshacer' })).not.toBeInTheDocument();
  });

  test('cancels an edit with Escape and drops a cell set back to its value', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Escape}');

    expect(screen.getByRole('cell', { name: 'ana@acme.dev' })).not.toHaveAttribute('data-changed');

    const input = await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');
    expect(screen.getByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();
    expect(input).not.toBeInTheDocument();

    await editCell(user, /ana@acme\.devx/);
    await user.keyboard('{Backspace}{Enter}');

    expect(screen.queryByRole('button', { name: /^Guardar/ })).not.toBeInTheDocument();
  });

  test('sets NULL in a cell', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await editCell(user, /bo@acme\.dev/);
    await user.click(screen.getByRole('button', { name: 'Poner NULL' }));
    await user.click(screen.getByRole('button', { name: 'Guardar (1)' }));

    await waitFor(() => expect(getSaveInputs()).toHaveLength(1));
    expect(getSaveInputs()[0]?.updates).toEqual([
      { key: [{ column: 'id', value: '2' }], values: [{ column: 'email', value: null }] }
    ]);
  });

  test('keeps the changes and shows the Postgres message when saving fails', async () => {
    mockApi({
      saveChanges: {
        saveTableChanges: {
          apiErrors: [{ code: 'QUERY_FAILED', message: 'invalid input syntax for type uuid' }],
          success: null
        }
      }
    });

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');

    await user.click(screen.getByRole('button', { name: 'Guardar (1)' }));

    expect(await screen.findByText('invalid input syntax for type uuid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ana@acme.devx' })).toHaveAttribute('data-changed');
  });

  test('discards every pending change with Undo', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');
    await user.click(screen.getByRole('button', { name: 'Agregar fila' }));
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Deshacer' }));

    expect(screen.getByText('ana@acme.dev')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: 'Fila nueva 1' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Guardar/ })).not.toBeInTheDocument();
  });

  test('adds new rows and inserts only the filled cells', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(screen.getByRole('button', { name: 'Agregar fila' }));
    const input = await screen.findByRole('textbox', { name: 'Editar id' });
    expect(input).toHaveFocus();
    await user.keyboard('{Enter}');

    const newRow = screen.getByRole('row', { name: 'Fila nueva 1' });
    expect(within(newRow).getAllByText('DEFAULT')).toHaveLength(3);

    await user.dblClick(within(newRow).getAllByRole('cell')[2] as HTMLElement);
    await user.keyboard('eva@acme.dev{Enter}');
    await user.dblClick(within(newRow).getAllByRole('cell')[3] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Poner NULL' }));

    await user.click(screen.getByRole('button', { name: 'Agregar fila' }));
    await user.keyboard('{Escape}');
    expect(screen.getByRole('row', { name: 'Fila nueva 2' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar (2)' }));

    await waitFor(() => expect(getSaveInputs()).toHaveLength(1));
    expect(getSaveInputs()[0]).toMatchObject({
      updates: [],
      inserts: [
        {
          values: [
            { column: 'email', value: 'eva@acme.dev' },
            { column: 'plan', value: null }
          ]
        },
        { values: [] }
      ]
    });
    await waitFor(() =>
      expect(screen.queryByRole('row', { name: 'Fila nueva 1' })).not.toBeInTheDocument()
    );
  });

  test('removes a selected new row without confirming', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await user.click(screen.getByRole('button', { name: 'Agregar fila' }));
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila nueva 1' }));
    await user.click(deleteButton());

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('row', { name: 'Fila nueva 1' })).not.toBeInTheDocument();
    expect(getDeleteInputs()).toHaveLength(0);
  });

  test('drops the pending edits of the deleted rows', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');
    await editCell(user, /bo@acme\.dev/);
    await user.keyboard('x{Enter}');

    await user.click(screen.getByRole('button', { name: 'Seleccionar la fila 1' }));
    await user.click(deleteButton());
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' })
    );

    expect(await screen.findByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();
  });

  test('asks before discarding the changes when changing the page', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText('Tienes 1 cambio sin guardar en esta tabla.')
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(lastRowsInput()?.page).toBe(1);
    expect(screen.getByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Descartar' })
    );

    await waitFor(() => expect(lastRowsInput()?.page).toBe(2));
    expect(screen.queryByRole('button', { name: /^Guardar/ })).not.toBeInTheDocument();
  });

  test('does not edit the cells of a table without primary key', async () => {
    mockApi({
      structure: {
        tableStructure: {
          apiErrors: [],
          structure: {
            ...STRUCTURE,
            columns: STRUCTURE.columns.map(column => ({ ...column, isPrimaryKey: false }))
          }
        }
      }
    });

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.dblClick(screen.getByRole('cell', { name: /ana@acme\.dev/ }));

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Agregar fila' }));
    expect(await screen.findByRole('textbox', { name: 'Editar id' })).toBeInTheDocument();
  });

  test('does not edit nor add rows on a view', async () => {
    mockApi();

    renderTab({ kind: 'view', schema: 'public', name: 'active_users' });
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.dblClick(screen.getByRole('cell', { name: /ana@acme\.dev/ }));

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar fila' })).not.toBeInTheDocument();
  });

  test('selects a cell with a click and edits it with Enter', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(screen.getByRole('cell', { name: 'ana@acme.dev' }));

    expect(screen.getByRole('cell', { name: 'ana@acme.dev' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(await screen.findByRole('textbox', { name: 'Editar email' })).toHaveValue(
      'ana@acme.dev'
    );
  });

  test('counts the value as a pending change while typing and keeps it on blur', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x');

    expect(screen.getByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('cell', { name: 'bo@acme.dev' }));

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ana@acme.devx' })).toHaveAttribute('data-changed');
    expect(screen.getByRole('cell', { name: 'bo@acme.dev' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('keeps the value and moves the selection with Tab and Shift+Tab', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Tab}');

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ana@acme.devx' })).toHaveAttribute('data-changed');
    const [, firstRow] = screen.getAllByRole('row');
    const cells = within(firstRow as HTMLElement).getAllByRole('cell');
    expect(cells[3]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    expect(await screen.findByRole('textbox', { name: 'Editar plan' })).toBeInTheDocument();
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(cells[2]).toHaveAttribute('aria-selected', 'true');
  });

  test('restores the value it had before editing with Escape', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');
    await editCell(user, /ana@acme\.dev/);
    await user.keyboard('x{Enter}');

    await user.keyboard('{Enter}');
    await user.keyboard('yz{Escape}');

    expect(screen.queryByRole('textbox', { name: /^Editar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ana@acme.devx' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();
  });
});
