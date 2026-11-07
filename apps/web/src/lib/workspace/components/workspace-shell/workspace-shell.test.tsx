import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { render } from '../../../../../tests/render';
import { ActiveConnectionProvider } from '../../contexts/active-connection-provider';

import { WorkspaceShell } from './workspace-shell';

vi.mock('@/lib/api/fetcher');

const CONNECTION = {
  id: 'connection-1',
  name: 'Acme prod',
  host: 'db.acme.dev',
  port: 5432,
  database: 'acme',
  username: 'ana',
  hasPassword: true,
  sslMode: 'REQUIRE'
};

const SCHEMAS = [
  {
    name: 'public',
    tables: [
      { name: 'users', columns: [] },
      { name: 'orders', columns: [] }
    ],
    views: [{ name: 'active_users', columns: [] }],
    functions: []
  },
  {
    name: 'billing',
    tables: [{ name: 'invoices', columns: [] }],
    views: [],
    functions: []
  }
];

const EXPANDED_IDS = [
  'schema:public',
  'group:public.tables',
  'group:public.views',
  'group:public.functions',
  'schema:billing',
  'group:billing.tables'
];

const STRUCTURE = {
  columns: [
    { name: 'id', type: 'uuid', isNullable: false, default: null, isPrimaryKey: true },
    { name: 'email', type: 'text', isNullable: false, default: null, isPrimaryKey: false }
  ],
  indexes: [],
  foreignKeys: [],
  definition: 'CREATE TABLE users ();'
};

const ROWS = {
  columns: [
    { name: 'id', type: 'uuid' },
    { name: 'email', type: 'text' }
  ],
  rows: [['user-1', 'ana@acme.dev']],
  totalRows: 1
};

const NOTES = {
  id: 'file-1',
  name: 'notes',
  type: 'TXT',
  content: '',
  updatedAt: '2026-11-01T12:00:00.000Z'
};

const DIAGRAM = {
  entities: [
    {
      id: 'public.users',
      schema: 'public',
      name: 'users',
      properties: [
        {
          name: 'id',
          type: 'uuid',
          default: null,
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false
        }
      ]
    }
  ],
  relations: []
};

const ROUTE_DIAGRAM = {
  entities: [
    {
      id: 'public.payments',
      schema: 'public',
      name: 'payments',
      properties: [
        {
          name: 'invoice_id',
          type: 'uuid',
          default: null,
          isNullable: false,
          isPrimaryKey: false,
          isForeignKey: true
        }
      ]
    },
    {
      id: 'billing.invoices',
      schema: 'billing',
      name: 'invoices',
      properties: [
        {
          name: 'id',
          type: 'uuid',
          default: null,
          isNullable: false,
          isPrimaryKey: true,
          isForeignKey: false
        }
      ]
    }
  ],
  relations: [
    {
      id: 'public.payments.fk',
      type: 'MANY_TO_ONE',
      fromEntityId: 'public.payments',
      fromProperties: ['invoice_id'],
      toEntityId: 'billing.invoices',
      toProperties: ['id']
    }
  ]
};

const getSchemaCalls = () =>
  vi
    .mocked(gqlFetcher)
    .mock.calls.filter(([document]) => document.toString().includes('query GetConnectionSchema'));

const getTabs = () =>
  within(screen.getByRole('tablist', { name: 'Pestañas abiertas' }))
    .getAllByRole('tab')
    .map(tab => tab.textContent);

const getLocation = () =>
  within(screen.getByRole('navigation', { name: 'Ubicación' }))
    .getAllByRole('listitem')
    .map(item => item.textContent);

const createDraft = async (user: ReturnType<typeof userEvent.setup>, type: string) => {
  await user.click(screen.getByRole('tab', { name: 'Archivos' }));
  await user.click(await screen.findByRole('button', { name: 'Nuevo archivo' }));
  await user.click(await screen.findByRole('menuitem', { name: type }));
};

const renderShell = () =>
  render(
    <ActiveConnectionProvider>
      <WorkspaceShell />
    </ActiveConnectionProvider>
  );

describe('WorkspaceShell', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      `dbiewer:explorer-expanded:${CONNECTION.id}`,
      JSON.stringify(EXPANDED_IDS)
    );
    vi.mocked(gqlFetcher).mockReset();
    vi.mocked(gqlFetcher).mockImplementation(async (document, variables) => {
      const query = document.toString();
      if (query.includes('query GetTableStructure')) {
        return { tableStructure: { apiErrors: [], structure: STRUCTURE } };
      }
      if (query.includes('query GetTableRows')) {
        return { tableRows: { apiErrors: [], tableRows: ROWS } };
      }
      if (query.includes('query GetSchemaDiagram')) {
        return { schemaDiagram: { apiErrors: [], diagram: DIAGRAM } };
      }
      if (query.includes('query GetFiles')) return { files: { items: [] } };
      if (query.includes('query GetFile')) return { file: NOTES };
      if (query.includes('mutation SaveFile')) {
        return { saveFile: { apiErrors: [], file: NOTES } };
      }
      return variables
        ? { connectionSchema: { apiErrors: [], schemas: SCHEMAS } }
        : { connections: { items: [CONNECTION] } };
    });
  });

  test('renders the sidebar next to the main area', async () => {
    renderShell();

    expect(await screen.findByRole('tab', { name: 'Explorador' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Archivos' })).toBeInTheDocument();
    expect(await screen.findByText('users')).toBeInTheDocument();
    expect(
      screen.getByText('Abre una tabla desde el explorador o un archivo desde Archivos.')
    ).toBeInTheDocument();
  });

  test('changes the search placeholder and shows the empty files on the Files tab', async () => {
    renderShell();
    const user = userEvent.setup();
    expect(await screen.findByPlaceholderText('Buscar tablas, vistas…')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Archivos' }));

    expect(screen.getByPlaceholderText('Filtrar archivos…')).toBeInTheDocument();
    expect(
      await screen.findByText('Aquí aparecen los archivos que guardes en esta conexión.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recargar' })).not.toBeInTheDocument();
  });

  test('filters the explorer in every schema and expands the groups with results', async () => {
    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'billing' }));
    expect(screen.queryByText('invoices')).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'ORDERS');
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.queryByText('users')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'billing' })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Buscar tablas, vistas…'));
    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'invo');
    expect(screen.getByText('invoices')).toBeInTheDocument();
  });

  test('removes the explorer filter when clearing the search with the button', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');
    const search = screen.getByPlaceholderText('Buscar tablas, vistas…');
    await user.type(search, 'orders');
    expect(screen.queryByText('users')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));

    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(screen.getByText('users')).toBeInTheDocument();
  });

  test('clears only the search of the active sidebar tab', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');
    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'orders');
    await user.click(screen.getByRole('tab', { name: 'Archivos' }));
    expect(screen.queryByRole('button', { name: 'Borrar búsqueda' })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Filtrar archivos…'), 'report');
    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }));
    expect(screen.getByPlaceholderText('Filtrar archivos…')).toHaveValue('');

    await user.click(screen.getByRole('tab', { name: 'Explorador' }));
    expect(screen.getByPlaceholderText('Buscar tablas, vistas…')).toHaveValue('orders');
  });

  test('shows a message when the search has no results', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');

    await user.type(screen.getByPlaceholderText('Buscar tablas, vistas…'), 'payments');

    expect(screen.getByText('Sin resultados para “payments”')).toBeInTheDocument();
  });

  test('keeps the chosen columns between tabs and forgets them when closing the tab', async () => {
    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.click(await screen.findByRole('button', { name: /^Columnas\s*2\/2$/ }));
    await user.click(await screen.findByRole('checkbox', { name: /^email/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'orders' }));
    expect(getTabs()).toEqual(['users', 'orders']);
    await screen.findByRole('heading', { name: 'orders' });

    await user.click(screen.getByRole('tab', { name: 'users' }));
    expect(await screen.findByRole('button', { name: /^Columnas\s*1\/2$/ })).toBeInTheDocument();
    expect(screen.queryByText('ana@acme.dev')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar users' }));
    await user.click(screen.getByRole('button', { name: 'users' }));

    expect(await screen.findByText('ana@acme.dev')).toBeInTheDocument();
  });

  test('does not offer new queries from the tab bar or the empty state', async () => {
    renderShell();
    await screen.findByText('users');

    expect(screen.queryByRole('button', { name: /Nueva consulta/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nuevo archivo' })).not.toBeInTheDocument();
  });

  test('asks before closing a tab with unsaved changes and keeps it when canceling', async () => {
    localStorage.setItem(
      `dbiewer:tabs:${CONNECTION.id}`,
      JSON.stringify({
        tabs: [{ key: 'draft:1', kind: 'draft', number: 1, type: 'txt', isDirty: true }],
        activeKey: 'draft:1',
        provisionalKey: null
      })
    );
    localStorage.setItem(`dbiewer:draft:${CONNECTION.id}:draft:1`, 'unsaved');

    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cerrar Sin título 1' }));

    const dialog = await screen.findByRole('alertdialog', { name: '¿Descartar los cambios?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(getTabs()).toEqual(['Sin título 1']);

    await user.click(screen.getByRole('button', { name: 'Cerrar Sin título 1' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Descartar' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument()
    );
    expect(localStorage.getItem(`dbiewer:draft:${CONNECTION.id}:draft:1`)).toBeNull();
  });

  test('reloads the schema', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');
    expect(getSchemaCalls()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await waitFor(() => expect(getSchemaCalls()).toHaveLength(2));
    expect(getSchemaCalls()[1]?.[1]).toEqual({ connectionId: CONNECTION.id });
  });

  test('resizes the sidebar with the keyboard and remembers the width', async () => {
    const { unmount } = renderShell();
    const user = userEvent.setup();
    const resizer = await screen.findByRole('separator', {
      name: 'Cambiar el ancho del panel lateral'
    });
    expect(resizer).toHaveAttribute('aria-valuenow', '256');

    resizer.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    expect(resizer).toHaveAttribute('aria-valuenow', '288');
    unmount();
    renderShell();
    expect(
      await screen.findByRole('separator', { name: 'Cambiar el ancho del panel lateral' })
    ).toHaveAttribute('aria-valuenow', '288');
  });

  test('keeps the sidebar width between the limits', async () => {
    localStorage.setItem('dbiewer:sidebar-width', '2000');
    renderShell();
    const user = userEvent.setup();
    const resizer = await screen.findByRole('separator', {
      name: 'Cambiar el ancho del panel lateral'
    });
    expect(resizer).toHaveAttribute('aria-valuenow', '520');

    await user.dblClick(resizer);

    expect(resizer).toHaveAttribute('aria-valuenow', '256');
  });

  test('starts with the default width when localStorage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    renderShell();

    expect(
      await screen.findByRole('separator', { name: 'Cambiar el ancho del panel lateral' })
    ).toHaveAttribute('aria-valuenow', '256');
    vi.restoreAllMocks();
  });

  test('expands a table from its chevron without opening it', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Columnas de users' }));

    expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Columnas de users' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('expands a view with a click without opening it', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'active_users' }));

    expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'active_users' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('keeps the pending table changes across tabs and asks before closing the table', async () => {
    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('cell', { name: /ana@acme\.dev/ }));
    await user.keyboard('x{Enter}');
    expect(screen.getByRole('img', { name: 'Cambios sin guardar' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'orders' }));
    await screen.findByRole('heading', { name: /orders/ });
    await user.click(screen.getByRole('tab', { name: 'users' }));
    expect(await screen.findByRole('button', { name: 'Guardar (1)' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar users' }));
    expect(
      await screen.findByRole('alertdialog', { name: '¿Descartar los cambios?' })
    ).toBeInTheDocument();
  });

  test('opens a table in the provisional tab and replaces it with the next one', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));
    expect(await screen.findByRole('heading', { name: /users/ })).toBeInTheDocument();
    expect(getTabs()).toEqual(['users']);
    expect(screen.getByRole('tab', { name: 'users' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'orders' }));

    expect(await screen.findByRole('heading', { name: /orders/ })).toBeInTheDocument();
    expect(getTabs()).toEqual(['orders']);
  });

  test('opens a view in the provisional tab from its open button', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Abrir active_users' }));

    expect(await screen.findByRole('heading', { name: /active_users/ })).toBeInTheDocument();
    expect(getTabs()).toEqual(['active_users']);
    expect(screen.getByRole('button', { name: 'active_users' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  test('opens a function with a double click and shows its definition', async () => {
    const [publicSchema, billingSchema] = SCHEMAS;
    const functions = [{ name: 'refresh_stats', arguments: 'since date', kind: 'FUNCTION' }];
    vi.mocked(gqlFetcher).mockImplementation(async (_document, variables) => {
      if ((variables as { input?: unknown } | undefined)?.input) {
        return {
          functionDefinition: { apiErrors: [], definition: 'CREATE FUNCTION refresh_stats' }
        };
      }
      return variables
        ? {
            connectionSchema: {
              apiErrors: [],
              schemas: [{ ...publicSchema, functions }, billingSchema]
            }
          }
        : { connections: { items: [CONNECTION] } };
    });

    renderShell();
    const user = userEvent.setup();
    await user.dblClick(await screen.findByRole('button', { name: 'refresh_stats(since date)' }));

    expect(getTabs()).toEqual(['refresh_stats(since date)']);
    expect(
      await screen.findByRole('textbox', { name: 'Definición de la función' })
    ).toHaveTextContent('CREATE FUNCTION refresh_stats');
  });

  test('pins a tab with a double click and keeps it when opening another', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('tab', { name: 'users' }));
    await user.click(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
    await user.click(screen.getByRole('tab', { name: 'users' }));
    expect(await screen.findByRole('heading', { name: /users/ })).toBeInTheDocument();
  });

  test('pins the provisional tab when changing to Structure', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.click(await screen.findByRole('tab', { name: 'Estructura' }));
    await user.click(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
  });

  test('closes a tab without confirmation and shows the empty state', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.click(await screen.findByRole('button', { name: 'Cerrar users' }));

    expect(screen.queryByRole('tablist', { name: 'Pestañas abiertas' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Abre una tabla desde el explorador o un archivo desde Archivos.')
    ).toBeInTheDocument();
  });

  test('restores the open tabs of the connection', async () => {
    const { unmount } = renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('tab', { name: 'users' }));
    unmount();

    renderShell();

    expect(await screen.findByRole('tab', { name: 'users' })).toBeInTheDocument();
  });

  test('pins the provisional tab when editing a cell', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('cell', { name: /ana@acme\.dev/ }));
    await user.keyboard('x{Enter}');
    await user.click(screen.getByRole('button', { name: 'orders' }));

    expect(getTabs()).toEqual(['users', 'orders']);
  });

  test('shows only the connection and its address in the status bar without tabs', async () => {
    renderShell();
    await screen.findByText('users');

    expect(getLocation()).toEqual(['Acme prod']);
    expect(
      within(screen.getByRole('contentinfo')).getByText('db.acme.dev:5432')
    ).toBeInTheDocument();
  });

  test('shows the path of the active table in the status bar', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'users' }));

    expect(getLocation()).toEqual(['Acme prod', 'public', 'users']);
  });

  test('shows the file name of a stored draft in the status bar', async () => {
    localStorage.setItem(
      `dbiewer:tabs:${CONNECTION.id}`,
      JSON.stringify({
        tabs: [{ key: 'draft:1', kind: 'draft', number: 1 }],
        activeKey: 'draft:1',
        provisionalKey: null
      })
    );

    renderShell();
    await screen.findByText('users');

    expect(getLocation()).toEqual(['Acme prod', 'Sin título 1.sql']);
    expect(screen.getByRole('textbox', { name: 'Editor SQL' })).toBeInTheDocument();
  });

  test('opens the diagram from the explorer and activates it when it is already open', async () => {
    renderShell();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Diagrama' }));

    expect(await screen.findByRole('article', { name: 'users' })).toBeInTheDocument();
    expect(getTabs()).toEqual(['Diagrama']);
    expect(getLocation()).toEqual(['Acme prod', 'Diagrama']);

    await user.click(screen.getByRole('button', { name: 'users' }));
    await user.dblClick(await screen.findByRole('tab', { name: 'users' }));
    await user.click(screen.getByRole('button', { name: 'Diagrama' }));

    expect(getTabs()).toEqual(['Diagrama', 'users']);
    expect(screen.getByRole('tab', { name: 'Diagrama' })).toHaveAttribute('aria-selected', 'true');
  });

  test('keeps the route and the schema of the diagram between tabs until closing it', async () => {
    const baseFetcher = vi.mocked(gqlFetcher).getMockImplementation();
    vi.mocked(gqlFetcher).mockImplementation(async (document, variables) =>
      document.toString().includes('query GetSchemaDiagram')
        ? { schemaDiagram: { apiErrors: [], diagram: ROUTE_DIAGRAM } }
        : baseFetcher?.(document, variables)
    );

    renderShell();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Diagrama' }));
    await user.click(
      await screen.findByRole('button', { name: 'Ir a la tabla referenciada por invoice_id' })
    );
    expect(await screen.findByRole('button', { name: 'Volver a payments' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'users' }));
    await screen.findByRole('heading', { name: 'users' });
    await user.click(screen.getByRole('tab', { name: 'Diagrama' }));

    expect(await screen.findByRole('button', { name: 'Volver a payments' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Esquema' })).toHaveTextContent('billing');

    await user.click(screen.getByRole('button', { name: 'Cerrar Diagrama' }));
    await user.click(screen.getByRole('button', { name: 'Diagrama' }));

    expect(await screen.findByRole('article', { name: 'payments' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Volver a payments' })).not.toBeInTheDocument();
  });

  test('opens SQL and text drafts from the Files tab', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');

    await createDraft(user, 'SQL');
    expect(getTabs()).toEqual(['Sin título 1']);
    expect(screen.getByRole('textbox', { name: 'Editor SQL' })).toBeInTheDocument();

    await createDraft(user, 'Texto');
    expect(getTabs()).toEqual(['Sin título 1', 'Sin título 2']);
    expect(screen.getByRole('tab', { name: 'Sin título 2' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('textbox', { name: 'Editor de texto' })).toBeInTheDocument();
    expect(getLocation()).toEqual(['Acme prod', 'Sin título 2.txt']);
  });

  test('asks for the name on the first save and turns the draft into a file', async () => {
    renderShell();
    const user = userEvent.setup();
    await screen.findByText('users');

    await createDraft(user, 'Texto');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Guardar archivo' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Nombre' }), 'notes');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(getTabs()).toEqual(['notes.txt']));
    expect(getLocation()).toEqual(['Acme prod', 'notes.txt']);
  });
});
