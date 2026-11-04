import { useState } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';
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
  rows = { tableRows: { apiErrors: [], tableRows: ROWS } } as Result
} = {}) => {
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();
    if (query.includes('query GetConnectionSchema')) {
      return { connectionSchema: { apiErrors: [], schemas: SCHEMAS } };
    }
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

const onStateChange = vi.fn<(state: TableViewState) => void>();

const onPin = vi.fn();

const lastState = () => onStateChange.mock.calls.at(-1)?.[0];

const Harness = ({ object }: { object: TableTabObject }) => {
  const [state, setState] = useState(DEFAULT_TABLE_VIEW_STATE);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

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
    expect(await screen.findByText('120 filas · 3 columnas')).toBeInTheDocument();
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
    expect(screen.getByText('varchar(255)')).toBeInTheDocument();
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

  test('opens the row detail with its values and pins the tab', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('cell', { name: /ana@acme\.dev/ }));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('id = 1')).toBeInTheDocument();
    expect(within(sheet).getByLabelText(/^email/)).toHaveValue('ana@acme.dev');
    expect(within(sheet).getByLabelText(/^email/)).toHaveAttribute('readonly');
    expect(onPin).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('row', { hidden: true })[1]).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await user.click(within(sheet).getByRole('button', { name: 'Copiar email' }));
    expect(await navigator.clipboard.readText()).toBe('ana@acme.dev');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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
    expect(screen.getByText('120 filas · 3 columnas')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: /^Columnas/, hidden: true })).not.toHaveTextContent(
      '/'
    );
  });

  test('keeps the row detail and the header order working with hidden columns', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await openColumnsMenu(user);
    await user.click(screen.getByRole('checkbox', { name: /^id/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() => expect(lastRowsInput()?.orderBy).toBe('email asc'));

    await user.click(screen.getByRole('cell', { name: /bo@acme\.dev/ }));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByLabelText(/^id/)).toHaveValue('2');
    expect(within(sheet).getByLabelText(/^email/)).toHaveValue('bo@acme.dev');
    expect(within(sheet).getByLabelText(/^plan/)).toHaveValue('');
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

  test('shows NULL distinct from an empty text in the row detail', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('cell', { name: /ana@acme\.dev/ }));
    const firstSheet = await screen.findByRole('dialog');
    expect(within(firstSheet).getByLabelText(/^plan/)).toHaveValue('');
    expect(within(firstSheet).getByLabelText(/^plan/)).toHaveAttribute('placeholder', 'NULL');
    await user.click(within(firstSheet).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('cell', { name: /bo@acme\.dev/ }));
    const secondSheet = await screen.findByRole('dialog');
    expect(within(secondSheet).getByLabelText(/^plan/)).toHaveValue('');
    expect(within(secondSheet).getByLabelText(/^plan/)).not.toHaveAttribute('placeholder');
  });
});
