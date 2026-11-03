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

type Result = unknown;

const mockApi = ({
  structure = { tableStructure: { apiErrors: [], structure: STRUCTURE } } as Result,
  rows = { tableRows: { apiErrors: [], tableRows: ROWS } } as Result
} = {}) => {
  vi.mocked(gqlFetcher).mockImplementation(async document => {
    const query = document.toString();
    if (query.includes('query GetConnectionSchema')) {
      return { connectionSchema: { apiErrors: [], schemas: [] } };
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
        onPin={onPin}
      />
    </div>
  );
};

const renderTab = (object = USERS) => render(<Harness object={object} />);

describe('TableTab', () => {
  beforeEach(() => {
    vi.mocked(gqlFetcher).mockReset();
    onPin.mockReset();
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
    expect(screen.getByText(/2 de 120 filas · \d+ ms/)).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(lastRowsInput()).toEqual({
      connectionId: 'connection-1',
      schema: 'public',
      name: 'users',
      filters: [],
      orderBy: null,
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

  test('adds, edits and removes a filter', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    await screen.findByText('ana@acme.dev');

    await user.click(screen.getByRole('button', { name: 'Agregar filtro' }));
    await user.click(await screen.findByRole('button', { name: 'Aplicar' }));
    expect(await screen.findByText('Ingresa un valor')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Valor'), "o'brien");
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() =>
      expect(lastRowsInput()?.filters).toEqual([{ column: 'id', operator: 'EQ', value: "o'brien" }])
    );
    expect(lastState()?.page).toBe(1);
    const chip = screen.getByRole('button', { name: "id = 'o''brien'" });

    await user.click(chip);
    await user.click(await screen.findByRole('combobox', { name: 'Operador' }));
    await user.click(await screen.findByRole('option', { name: 'is null' }));
    expect(screen.queryByLabelText('Valor')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() =>
      expect(lastRowsInput()?.filters).toEqual([{ column: 'id', operator: 'IS_NULL', value: null }])
    );

    await user.click(screen.getByRole('button', { name: 'Quitar filtro' }));

    await waitFor(() => expect(lastRowsInput()?.filters).toEqual([]));
  });

  test('orders from the grid header and from ORDER BY', async () => {
    mockApi();

    renderTab();
    const user = userEvent.setup();
    expect(await screen.findByRole('combobox', { name: 'ORDER BY' })).toHaveTextContent('id');

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() =>
      expect(lastRowsInput()?.orderBy).toEqual({ column: 'email', direction: 'ASC' })
    );
    expect(screen.getByRole('columnheader', { name: /^email/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );

    await user.click(screen.getByRole('button', { name: /^email/ }));
    await waitFor(() =>
      expect(lastRowsInput()?.orderBy).toEqual({ column: 'email', direction: 'DESC' })
    );

    await user.click(screen.getByRole('button', { name: 'Descendente' }));
    await waitFor(() =>
      expect(lastRowsInput()?.orderBy).toEqual({ column: 'email', direction: 'ASC' })
    );
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
    expect(screen.getByRole('button', { name: 'Agregar filtro' })).toBeInTheDocument();
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
    await user.click(await screen.findByRole('button', { name: 'Agregar filtro' }));
    await user.type(await screen.findByLabelText('Valor'), '9');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

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
