import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';

import { gqlFetcher } from '@/lib/api/fetcher';

import { createMouseEvent, measureNodes, VIEWPORT } from '../../../../../tests/react-flow';
import { render } from '../../../../../tests/render';
import { DEFAULT_DIAGRAM_NAVIGATION } from '../../constants/diagram-navigation';

import { DiagramTab } from './diagram-tab';

vi.mock('@/lib/api/fetcher');

const CONNECTION_ID = 'connection-1';
const POSITIONS_KEY = `dbiewer:diagram-positions:${CONNECTION_ID}`;

const property = (name: string, type: string, overrides = {}) => ({
  name,
  type,
  default: null,
  isNullable: false,
  isPrimaryKey: false,
  isForeignKey: false,
  ...overrides
});

const USERS = {
  id: 'public.users',
  schema: 'public',
  name: 'users',
  properties: [
    property('id', 'uuid', { isPrimaryKey: true }),
    property('created_at', 'timestamp with time zone', { default: 'now()' })
  ]
};

const ORDERS = {
  id: 'public.orders',
  schema: 'public',
  name: 'orders',
  properties: [
    property('id', 'uuid', { isPrimaryKey: true }),
    property('user_id', 'uuid', { isForeignKey: true, isNullable: true })
  ]
};

const INVOICES = {
  id: 'billing.invoices',
  schema: 'billing',
  name: 'invoices',
  properties: [property('id', 'uuid', { isPrimaryKey: true })]
};

const PRODUCTS = {
  id: 'public.products',
  schema: 'public',
  name: 'products',
  properties: [property('id', 'uuid', { isPrimaryKey: true })]
};

const RELATION = {
  id: 'public.orders.orders_user_id_fkey',
  type: 'MANY_TO_ONE',
  fromEntityId: 'public.orders',
  fromProperties: ['user_id'],
  toEntityId: 'public.users',
  toProperties: ['id']
};

const mockDiagram = (entities: unknown[], relations: unknown[] = []) =>
  vi.mocked(gqlFetcher).mockResolvedValue({
    schemaDiagram: { apiErrors: [], diagram: { entities, relations } }
  });

const getEntity = (name: string) => screen.findByRole('article', { name });

const getStoredPositions = () =>
  JSON.parse(localStorage.getItem(POSITIONS_KEY) ?? '{}') as Record<string, unknown>;

const getNodeTransform = (name: string) =>
  screen.getByRole('article', { name }).closest<HTMLElement>('.react-flow__node')?.style.transform;

const getNodePosition = (name: string) => {
  const [, x, y] = /translate\((.+)px,\s*(.+)px\)/.exec(getNodeTransform(name) ?? '') ?? [];

  return { x: Number(x), y: Number(y) };
};

const getMarks = () => screen.queryAllByRole('mark').map(mark => mark.textContent);

const getEdgePath = () => document.querySelector('.react-flow__edge-path');

const ROUTE_USERS = {
  ...USERS,
  properties: [...USERS.properties, property('team_id', 'uuid', { isForeignKey: true })]
};

const TEAMS = {
  id: 'public.teams',
  schema: 'public',
  name: 'teams',
  properties: [property('id', 'uuid', { isPrimaryKey: true })]
};

const PAYMENTS = {
  id: 'public.payments',
  schema: 'public',
  name: 'payments',
  properties: [property('buyer_id', 'uuid', { isForeignKey: true })]
};

const mockRoute = () =>
  mockDiagram(
    [ROUTE_USERS, ORDERS, TEAMS, PAYMENTS, PRODUCTS],
    [
      RELATION,
      {
        ...RELATION,
        id: 'public.users.fk',
        fromEntityId: ROUTE_USERS.id,
        fromProperties: ['team_id'],
        toEntityId: TEAMS.id
      },
      {
        ...RELATION,
        id: 'public.payments.fk',
        fromEntityId: PAYMENTS.id,
        fromProperties: ['buyer_id']
      }
    ]
  );

const followForeignKey = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
  user.click(
    await screen.findByRole('button', {
      name: `Ir a la tabla referenciada por ${name}`,
      hidden: true
    })
  );

const findBackButton = (name: string) => screen.findByRole('button', { name: `Volver a ${name}` });

const queryBackButton = (name: string) =>
  screen.queryByRole('button', { name: `Volver a ${name}` });

const getMenuItems = (group: HTMLElement) =>
  within(group)
    .getAllByRole('menuitem')
    .map(item => item.textContent);

const getNodeOf = (element: HTMLElement) => element.closest('.react-flow__node');

const expectCentered = (name: string, entity: { properties: unknown[] }) => {
  const transform = document.querySelector<HTMLElement>('.react-flow__viewport')?.style.transform;
  const [, x, y, zoom] = /translate\((.+)px,\s*(.+)px\) scale\((.+)\)/.exec(transform ?? '') ?? [];
  const position = getNodePosition(name);
  const height = 36 + entity.properties.length * 28 + 2;

  expect(Number(x) + (position.x + 144) * Number(zoom)).toBeCloseTo(VIEWPORT.width / 2);
  expect(Number(y) + (position.y + height / 2) * Number(zoom)).toBeCloseTo(VIEWPORT.height / 2);
};

const chooseSchema = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('combobox', { name: 'Esquema', hidden: true }));
  await user.click(await screen.findByRole('option', { name }));
};

const getEdges = () => document.querySelectorAll('.react-flow__edge');

const renderTab = () =>
  render(
    <div style={{ width: 800, height: 600 }}>
      <DiagramTab
        connectionId={CONNECTION_ID}
        initialNavigation={DEFAULT_DIAGRAM_NAVIGATION}
        onNavigationChange={() => {}}
      />
    </div>
  );

describe('DiagramTab', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(gqlFetcher).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('shows a loading state while the diagram loads', async () => {
    vi.mocked(gqlFetcher).mockReturnValue(new Promise(() => {}));

    renderTab();

    expect(await screen.findByRole('status', { name: 'Cargando el diagrama' })).toBeInTheDocument();
  });

  test('renders a box per table with its properties and marks', async () => {
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();

    const users = await getEntity('users');
    expect(within(users).getByRole('heading', { name: 'users' })).toBeInTheDocument();
    expect(within(users).getByText('created_at')).toBeInTheDocument();
    expect(within(users).getByText('timestamptz')).toBeInTheDocument();
    expect(within(users).getByRole('img', { name: 'Llave primaria' })).toBeInTheDocument();

    const orders = await getEntity('orders');
    expect(
      within(orders).getByRole('button', { name: 'Ir a la tabla referenciada por user_id' })
    ).toBeInTheDocument();
    expect(within(orders).getByRole('img', { name: 'Admite null' })).toBeInTheDocument();
    expect(gqlFetcher).toHaveBeenCalledWith(expect.anything(), { connectionId: CONNECTION_ID });
  });

  test('marks the table names that match and dims the tables that do not', async () => {
    measureNodes();
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    const user = userEvent.setup();
    await getEntity('users');
    const search = screen.getByRole('searchbox', { name: 'Buscar tablas…' });
    expect(getMarks()).toEqual([]);
    await waitFor(() => expect(getEdges()).toHaveLength(1));
    expect(getEdgePath()).not.toHaveStyle({ opacity: '0.15' });

    await user.type(search, 'USER');

    expect(getMarks()).toEqual(['user']);
    expect(within(await getEntity('users')).getByRole('heading')).toHaveTextContent('users');
    expect(within(await getEntity('orders')).getByText('user_id')).toBeInTheDocument();
    expect(await getEntity('users')).not.toHaveAttribute('data-dimmed');
    expect(await getEntity('orders')).toHaveAttribute('data-dimmed');
    expect(getEdgePath()).toHaveStyle({ opacity: '0.15' });

    await user.clear(search);

    expect(getMarks()).toEqual([]);
    expect(await getEntity('orders')).not.toHaveAttribute('data-dimmed');
    expect(getEdgePath()).not.toHaveStyle({ opacity: '0.15' });
  });

  test('shows an empty state when the database has no tables', async () => {
    mockDiagram([]);

    renderTab();

    expect(await screen.findByText('Esta base de datos no tiene tablas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ajustar la vista' })).not.toBeInTheDocument();
  });

  test('shows the error and retries', async () => {
    vi.mocked(gqlFetcher).mockResolvedValue({
      schemaDiagram: {
        apiErrors: [{ code: 'CONNECTION_FAILED', message: 'ECONNREFUSED' }],
        diagram: null
      }
    });

    renderTab();
    const user = userEvent.setup();
    expect(
      await screen.findByText('No pudimos conectarnos a la base de datos')
    ).toBeInTheDocument();

    mockDiagram([USERS]);
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(await getEntity('users')).toBeInTheDocument();
  });

  test('uses the stored position and places a new table with the auto layout', async () => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify({ 'public.orders': { x: 640, y: 320 } }));
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    await getEntity('orders');

    expect(getNodeTransform('orders')).toBe('translate(640px,320px)');
    expect(getNodeTransform('users')).toMatch(/^translate\(/);
    expect(getNodeTransform('users')).not.toBe('translate(640px,320px)');
  });

  test('remembers where the user leaves a table', async () => {
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    const node = (await getEntity('orders')).closest('.react-flow__node') as HTMLElement;
    await waitFor(() => expect(node).toHaveClass('draggable'));
    const start = getNodePosition('orders');

    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());

    fireEvent(node, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));

    await waitFor(() => expect(Object.keys(getStoredPositions())).toEqual(['public.orders']));
    const end = getNodePosition('orders');
    expect(end.x).toBeCloseTo(start.x + 50);
    expect(end.y).toBeCloseTo(start.y + 30);
    expect(getStoredPositions()['public.orders']).toEqual(end);
  });

  test('goes back to the auto layout and forgets the stored positions', async () => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify({ 'public.users': { x: 640, y: 320 } }));
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    const user = userEvent.setup();
    await getEntity('users');

    await user.click(screen.getByRole('button', { name: 'Acomodo automático' }));

    await waitFor(() => expect(getNodeTransform('users')).not.toBe('translate(640px,320px)'));
    expect(getStoredPositions()).toEqual({});
  });

  test('does not offer the schema select with only one schema', async () => {
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    await getEntity('users');

    expect(screen.queryByRole('combobox', { name: 'Esquema' })).not.toBeInTheDocument();
  });

  test('shows public first and changes the tables with the select', async () => {
    mockDiagram([INVOICES, USERS]);

    renderTab();
    const user = userEvent.setup();
    await getEntity('users');
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('public');
    expect(screen.queryByRole('article', { name: 'invoices' })).not.toBeInTheDocument();

    await chooseSchema(user, 'billing');

    expect(
      await screen.findByRole('article', { name: 'invoices', hidden: true })
    ).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: 'users', hidden: true })).not.toBeInTheDocument();
  });

  test('shows the first schema when there is no public schema', async () => {
    mockDiagram([INVOICES, { ...USERS, id: 'auth.users', schema: 'auth' }]);

    renderTab();

    expect(await getEntity('invoices')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('billing');
  });

  test('centers the referenced table', async () => {
    measureNodes();
    mockDiagram([USERS, ORDERS, PRODUCTS], [RELATION]);

    renderTab();
    const user = userEvent.setup();
    const orders = await getEntity('orders');
    const button = within(orders).getByRole('button', {
      name: 'Ir a la tabla referenciada por user_id'
    });
    await user.click(button);

    await waitFor(() => expectCentered('users', USERS));
  });

  test('does not drag the table from the foreign key button', async () => {
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    const orders = await getEntity('orders');
    const node = orders.closest('.react-flow__node') as HTMLElement;
    await waitFor(() => expect(node).toHaveClass('draggable'));
    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());
    const start = getNodePosition('orders');
    const button = within(orders).getByRole('button', {
      name: 'Ir a la tabla referenciada por user_id'
    });

    fireEvent(button, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));

    expect(getStoredPositions()).toEqual({});
    expect(getNodePosition('orders')).toEqual(start);
  });

  test('changes the schema and centers the referenced table from another schema', async () => {
    measureNodes();
    const payments = {
      id: 'public.payments',
      schema: 'public',
      name: 'payments',
      properties: [property('invoice_id', 'uuid', { isPrimaryKey: true, isForeignKey: true })]
    };
    mockDiagram(
      [payments, USERS, INVOICES],
      [
        {
          ...RELATION,
          id: 'public.payments.fk',
          fromEntityId: payments.id,
          fromProperties: ['invoice_id'],
          toEntityId: INVOICES.id
        }
      ]
    );

    renderTab();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Ir a la tabla referenciada por invoice_id' })
    );

    expect(await getEntity('invoices')).toBeInTheDocument();
    expect(await getEntity('invoices')).toHaveAttribute('data-jumped');
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('billing');
    await waitFor(() => expectCentered('invoices', INVOICES));
  });

  test('goes back step by step through the route', async () => {
    measureNodes();
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    expect(getNodeOf(await findBackButton('orders'))).toHaveTextContent('users');
    await waitFor(() => expectCentered('users', ROUTE_USERS));

    await followForeignKey(user, 'team_id');
    expect(getNodeOf(await findBackButton('users'))).toHaveTextContent('teams');
    expect(queryBackButton('orders')).not.toBeInTheDocument();
    await waitFor(() => expectCentered('teams', TEAMS));

    await user.click(await findBackButton('users'));

    expect(getNodeOf(await findBackButton('orders'))).toHaveTextContent('users');
    await waitFor(() => expectCentered('users', ROUTE_USERS));

    await user.click(await findBackButton('orders'));

    await waitFor(() => expect(screen.queryAllByRole('button', { name: /^Volver a/ })).toEqual([]));
    await waitFor(() => expectCentered('orders', ORDERS));
  });

  test('clears the route', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    const clear = await screen.findByRole('button', { name: 'Borrar el recorrido' });

    await user.click(clear);

    expect(queryBackButton('orders')).not.toBeInTheDocument();
  });

  test('starts a new route from a table outside the current one', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    await findBackButton('orders');

    await followForeignKey(user, 'buyer_id');

    expect(getNodeOf(await findBackButton('payments'))).toHaveTextContent('users');
    expect(queryBackButton('orders')).not.toBeInTheDocument();
  });

  test('goes back to a table of another schema', async () => {
    const payments = {
      id: 'public.payments',
      schema: 'public',
      name: 'payments',
      properties: [property('invoice_id', 'uuid', { isForeignKey: true })]
    };
    mockDiagram(
      [payments, INVOICES],
      [
        {
          ...RELATION,
          id: 'public.payments.fk',
          fromEntityId: payments.id,
          fromProperties: ['invoice_id'],
          toEntityId: INVOICES.id
        }
      ]
    );

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'invoice_id');
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('billing');

    await user.click(await findBackButton('payments'));

    expect(await getEntity('payments')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('public');
    expect(queryBackButton('payments')).not.toBeInTheDocument();
  });

  test('clears the route when going back to the auto layout or reloading', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    await findBackButton('orders');

    await user.click(screen.getByRole('button', { name: 'Acomodo automático' }));
    expect(queryBackButton('orders')).not.toBeInTheDocument();

    await followForeignKey(user, 'user_id');
    await findBackButton('orders');

    await user.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(queryBackButton('orders')).not.toBeInTheDocument();
  });

  test('clears the route when changing the schema with the select', async () => {
    mockDiagram([USERS, ORDERS, INVOICES], [RELATION]);

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    await findBackButton('orders');

    await chooseSchema(user, 'billing');
    await chooseSchema(user, 'public');

    await getEntity('users');
    expect(queryBackButton('orders')).not.toBeInTheDocument();
  });

  test('keeps the route when dragging a table or searching', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    await findBackButton('orders');
    const node = (await getEntity('teams')).closest('.react-flow__node') as HTMLElement;
    await waitFor(() => expect(node).toHaveClass('draggable'));
    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());

    fireEvent(node, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));
    await user.type(screen.getByRole('searchbox', { name: 'Buscar tablas…' }), 'team');

    expect(await findBackButton('orders')).toBeInTheDocument();
  });

  test('does not drag the table from the route buttons', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await followForeignKey(user, 'user_id');
    const back = await findBackButton('orders');
    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());
    const start = getNodePosition('users');

    fireEvent(back, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));

    expect(getStoredPositions()).toEqual({});
    expect(getNodePosition('users')).toEqual(start);
  });

  test('does not offer the focus toggle and does not dim tables on hover', async () => {
    mockDiagram([USERS, ORDERS, PRODUCTS], [RELATION]);

    renderTab();
    const user = userEvent.setup();
    await user.hover(await getEntity('orders'));

    expect(screen.queryByRole('button', { name: 'Foco' })).not.toBeInTheDocument();
    expect(await getEntity('products')).not.toHaveAttribute('data-dimmed');
  });

  test('lists the related tables in both directions from the relations button', async () => {
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Ir a relaciones de users' }));

    const pointsTo = await screen.findByRole('group', { name: 'Apunta a' });
    const pointedBy = screen.getByRole('group', { name: 'Apuntan a ella' });
    expect(getMenuItems(pointsTo)).toEqual(['teams']);
    expect(getMenuItems(pointedBy)).toEqual(['orders', 'payments']);
  });

  test('does not show the relations button on a table without relations', async () => {
    mockRoute();

    renderTab();
    await getEntity('products');

    expect(
      screen.queryByRole('button', { name: 'Ir a relaciones de products' })
    ).not.toBeInTheDocument();
  });

  test('does not drag the table from the relations button', async () => {
    mockDiagram([USERS, ORDERS], [RELATION]);

    renderTab();
    const orders = await getEntity('orders');
    const node = orders.closest('.react-flow__node') as HTMLElement;
    await waitFor(() => expect(node).toHaveClass('draggable'));
    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());
    const start = getNodePosition('orders');
    const button = within(orders).getByRole('button', { name: 'Ir a relaciones de orders' });

    fireEvent(button, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));

    expect(getStoredPositions()).toEqual({});
    expect(getNodePosition('orders')).toEqual(start);
  });

  test('centers the chosen related table and offers going back', async () => {
    measureNodes();
    mockRoute();

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Ir a relaciones de users' }));
    await user.click(await screen.findByRole('menuitem', { name: 'teams' }));

    expect(getNodeOf(await findBackButton('users'))).toHaveTextContent('teams');
    await waitFor(() => expectCentered('teams', TEAMS));
  });

  test('changes the schema when the related table is in another schema', async () => {
    mockDiagram(
      [ORDERS, INVOICES],
      [{ ...RELATION, id: 'billing.invoices.fk', fromEntityId: INVOICES.id, toEntityId: ORDERS.id }]
    );

    renderTab();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Ir a relaciones de orders' }));
    await user.click(await screen.findByRole('menuitem', { name: 'billing.invoices' }));

    expect(await getEntity('invoices')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Esquema' })).toHaveTextContent('billing');
    expect(await findBackButton('orders')).toBeInTheDocument();
  });

  test('reloads the diagram and shows the new tables', async () => {
    mockDiagram([USERS]);

    renderTab();
    const user = userEvent.setup();
    await getEntity('users');

    mockDiagram([USERS, ORDERS]);
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    expect(await getEntity('orders')).toBeInTheDocument();
  });
});
