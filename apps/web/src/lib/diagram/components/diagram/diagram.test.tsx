import { useState } from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import { beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';

import { createMouseEvent, measureNodes } from '../../../../../tests/react-flow';
import { render } from '../../../../../tests/render';
import type { DiagramEntity, DiagramRelation } from '../../utils/diagram.utils';

import { Diagram } from './diagram';

const entity = (name: string, foreignKey?: string): DiagramEntity => ({
  id: `public.${name}`,
  schema: 'public',
  name,
  properties: [
    { name: 'id', type: 'uuid', isNullable: false, isPrimaryKey: true, isForeignKey: false },
    ...(foreignKey
      ? [
          {
            name: foreignKey,
            type: 'uuid',
            isNullable: false,
            isPrimaryKey: false,
            isForeignKey: true
          }
        ]
      : [])
  ]
});

const relation = (from: string, to: string): DiagramRelation => ({
  id: `public.${from}.${to}.fk`,
  type: 'MANY_TO_ONE',
  fromEntityId: `public.${from}`,
  fromProperties: ['user_id'],
  toEntityId: `public.${to}`,
  toProperties: ['id']
});

const USERS = entity('users');
const ORDERS = entity('orders', 'user_id');
const PRODUCTS = entity('products');
const ENTITIES = [USERS, ORDERS, PRODUCTS];
const RELATIONS = [relation('orders', 'users')];

const onPinnedIdChange = vi.fn<(id: string | null) => void>();

type Props = {
  entities?: DiagramEntity[];
  relations?: DiagramRelation[];
  isFocusEnabled?: boolean;
  search?: string;
  initialPinnedId?: string | null;
  initialTrail?: string[];
  initialCenterId?: string | null;
};

const Harness = ({
  entities = ENTITIES,
  relations = RELATIONS,
  isFocusEnabled = true,
  search = '',
  initialPinnedId = null,
  initialTrail = [],
  initialCenterId = null
}: Props) => {
  const [pinnedId, setPinnedId] = useState(initialPinnedId);
  const [trail, setTrail] = useState(initialTrail);
  const [positions] = useState(() =>
    Object.fromEntries(entities.map(({ id }, index) => [id, { x: index * 400, y: 0 }]))
  );
  const [fullModel] = useState({ entities, relations });

  return (
    <div style={{ width: 800, height: 600 }}>
      <ReactFlowProvider>
        <Diagram
          entities={entities}
          relations={relations}
          fullModel={fullModel}
          positions={positions}
          initialCenterId={initialCenterId}
          trail={trail}
          onTrailChange={setTrail}
          search={search}
          isFocusEnabled={isFocusEnabled}
          pinnedId={pinnedId}
          onPinnedIdChange={id => {
            onPinnedIdChange(id);
            setPinnedId(id);
          }}
          onHiddenEntityRequest={() => {}}
          onPositionChange={() => {}}
        />
      </ReactFlowProvider>
    </div>
  );
};

const getEntity = (name: string) => screen.findByRole('article', { name, hidden: true });

const getNode = async (name: string) =>
  (await getEntity(name)).closest('.react-flow__node') as HTMLElement;

const getMenuBackdrop = () => document.querySelector('[role="presentation"]') as HTMLElement;

const dispatchWheel = (init: WheelEventInit) => {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init });
  document.dispatchEvent(event);

  return event;
};

const findForeignKeyButton = () =>
  screen.findByRole('button', { name: 'Ir a la tabla referenciada por user_id' });

const useFakeTimeouts = () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  onTestFinished(() => {
    vi.useRealTimers();
  });
};

const getEdges = () => document.querySelectorAll('.react-flow__edge');

const getHubModel = () => {
  const sources = Array.from({ length: 8 }, (_, index) => entity(`source_${index}`, 'user_id'));

  return {
    entities: [USERS, ORDERS, ...sources],
    relations: [
      ...sources.map(({ name }) => relation(name, 'users')),
      relation('source_0', 'orders')
    ]
  };
};

describe('Diagram', () => {
  beforeEach(() => {
    onPinnedIdChange.mockReset();
  });

  test('focuses a table on hover and dims the rest', async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.hover(await getEntity('orders'));

    expect(await getEntity('orders')).not.toHaveAttribute('data-dimmed');
    expect(await getEntity('users')).not.toHaveAttribute('data-dimmed');
    expect(await getEntity('products')).toHaveAttribute('data-dimmed');

    await user.unhover(await getEntity('orders'));

    expect(await getEntity('products')).not.toHaveAttribute('data-dimmed');
  });

  test('pins the focus with a click, changes it and removes it from the canvas', async () => {
    render(<Harness />);
    fireEvent.click(await getEntity('orders'));
    expect(await getEntity('products')).toHaveAttribute('data-dimmed');

    fireEvent.click(await getEntity('products'));
    expect(await getEntity('products')).not.toHaveAttribute('data-dimmed');
    expect(await getEntity('orders')).toHaveAttribute('data-dimmed');

    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);

    expect(await getEntity('orders')).not.toHaveAttribute('data-dimmed');
  });

  test('does not pin the focus when dragging a table', async () => {
    render(<Harness />);
    const node = await getNode('orders');
    await waitFor(() => expect(node).toHaveClass('draggable'));
    const animationFrame = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0);
    onTestFinished(() => animationFrame.mockRestore());

    fireEvent(node, createMouseEvent('mousedown', 10, 10));
    fireEvent(window, createMouseEvent('mousemove', 60, 30));
    fireEvent(window, createMouseEvent('mousemove', 110, 60));
    fireEvent(window, createMouseEvent('mouseup', 110, 60));
    fireEvent.click(node);

    expect(onPinnedIdChange).not.toHaveBeenCalled();
  });

  test('hides the lines to a hub until one of its tables has the focus', async () => {
    measureNodes();
    render(<Harness {...getHubModel()} />);
    const user = userEvent.setup();
    await getEntity('users');
    await waitFor(() => expect(getEdges()).toHaveLength(1));

    await user.hover(await getEntity('source_1'));
    await waitFor(() => expect(getEdges()).toHaveLength(2));

    await user.unhover(await getEntity('source_1'));
    await user.hover(await getEntity('users'));
    await waitFor(() => expect(getEdges()).toHaveLength(9));
  });

  test('does nothing on hover or click with the focus off', async () => {
    render(<Harness isFocusEnabled={false} />);
    const user = userEvent.setup();
    await user.hover(await getEntity('orders'));
    fireEvent.click(await getEntity('orders'));
    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);

    expect(await getEntity('products')).not.toHaveAttribute('data-dimmed');
    expect(onPinnedIdChange).not.toHaveBeenCalled();
  });

  test('keeps the lines to a hub hidden with the focus off', async () => {
    measureNodes();
    render(<Harness {...getHubModel()} isFocusEnabled={false} />);
    const user = userEvent.setup();
    await getEntity('users');
    await waitFor(() => expect(getEdges()).toHaveLength(1));

    await user.hover(await getEntity('users'));
    fireEvent.click(await getEntity('users'));

    expect(getEdges()).toHaveLength(1);
  });

  test('dims a table when the focus or the search dims it', async () => {
    render(<Harness search="prod" initialPinnedId="public.orders" />);

    expect(await getEntity('orders')).toHaveAttribute('data-dimmed');
    expect(await getEntity('users')).toHaveAttribute('data-dimmed');
    expect(await getEntity('products')).toHaveAttribute('data-dimmed');
  });

  test('ignores a pinned table that is not visible', async () => {
    render(<Harness initialPinnedId="billing.invoices" />);

    expect(await getEntity('users')).not.toHaveAttribute('data-dimmed');
  });

  test('highlights the table after a jump from a foreign key and removes it alone', async () => {
    render(<Harness />);
    const users = await getEntity('users');
    const button = await findForeignKeyButton();
    useFakeTimeouts();

    fireEvent.click(button);
    expect(users).toHaveAttribute('data-jumped');

    act(() => vi.advanceTimersByTime(1499));
    expect(users).toHaveAttribute('data-jumped');

    act(() => vi.advanceTimersByTime(1));
    expect(users).not.toHaveAttribute('data-jumped');
  });

  test('highlights the same table again when jumping to it', async () => {
    render(<Harness />);
    const users = await getEntity('users');
    const button = await findForeignKeyButton();
    useFakeTimeouts();

    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(button);
    act(() => vi.advanceTimersByTime(1000));
    expect(users).toHaveAttribute('data-jumped');

    act(() => vi.advanceTimersByTime(500));
    expect(users).not.toHaveAttribute('data-jumped');

    fireEvent.click(button);
    expect(users).toHaveAttribute('data-jumped');
  });

  test('highlights the table after going back and replaces the previous highlight', async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(await findForeignKeyButton());
    expect(await getEntity('users')).toHaveAttribute('data-jumped');

    await user.click(await screen.findByRole('button', { name: 'Volver a orders' }));

    expect(await getEntity('orders')).toHaveAttribute('data-jumped');
    expect(await getEntity('users')).not.toHaveAttribute('data-jumped');
  });

  test('highlights the table chosen in the relations menu', async () => {
    render(<Harness />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Ir a relaciones de orders' }));
    await user.click(await screen.findByRole('menuitem', { name: 'users' }));

    expect(await getEntity('users')).toHaveAttribute('data-jumped');
  });

  test('highlights the initial table when arriving from another schema', async () => {
    render(<Harness initialCenterId="public.users" />);

    expect(await getEntity('users')).toHaveAttribute('data-jumped');
  });

  test('does not pin the focus from the foreign key button', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.click(
      within(await getEntity('orders')).getByRole('button', {
        name: 'Ir a la tabla referenciada por user_id'
      })
    );

    expect(onPinnedIdChange).not.toHaveBeenCalled();
  });

  test('does not pin the focus from the route buttons', async () => {
    render(<Harness initialTrail={['public.orders', 'public.users']} />);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Borrar el recorrido' }));

    expect(onPinnedIdChange).not.toHaveBeenCalled();
  });

  test('does not pin the focus from the relations menu', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    const openMenu = async () =>
      user.click(
        await screen.findByRole('button', { name: 'Ir a relaciones de orders', hidden: true })
      );

    await openMenu();
    await user.click(await screen.findByText('Apunta a'));
    await user.click(getMenuBackdrop());
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

    await openMenu();
    await user.click(await screen.findByRole('menuitem', { name: 'users' }));

    expect(onPinnedIdChange).not.toHaveBeenCalled();
  });

  test('prevents the page zoom from a pinch only while the diagram is mounted', async () => {
    const { unmount } = render(<Harness />);
    await getEntity('users');

    expect(dispatchWheel({ ctrlKey: true }).defaultPrevented).toBe(true);
    expect(dispatchWheel({ ctrlKey: false }).defaultPrevented).toBe(false);

    unmount();

    expect(dispatchWheel({ ctrlKey: true }).defaultPrevented).toBe(false);
  });
});
