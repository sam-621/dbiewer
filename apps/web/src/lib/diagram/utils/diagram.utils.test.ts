import { Position } from '@xyflow/react';
import { describe, expect, test } from 'vitest';

import {
  advanceDiagramTrail,
  type DiagramEntity,
  type DiagramModel,
  type DiagramRelation,
  getDiagramCenter,
  getDiagramEdges,
  getDiagramFocus,
  getDiagramHubs,
  getDiagramMatches,
  getDiagramNodes,
  getDiagramSchemaModel,
  getDiagramSchemas,
  getHighlightParts,
  getReferencedEntityId,
  getRelatedEntities,
  getRelationEndsPath
} from './diagram.utils';

const entity = (schema: string, name: string): DiagramEntity => ({
  id: `${schema}.${name}`,
  schema,
  name,
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
});

const relation = (from: string, to: string): DiagramRelation => ({
  id: `${from}.fk`,
  type: 'MANY_TO_ONE',
  fromEntityId: from,
  fromProperties: ['user_id', 'tenant_id'],
  toEntityId: to,
  toProperties: ['id', 'tenant_id']
});

const MODEL: DiagramModel = {
  entities: [entity('public', 'users'), entity('public', 'orders'), entity('billing', 'invoices')],
  relations: [
    relation('public.orders', 'public.users'),
    relation('billing.invoices', 'public.orders')
  ]
};

const FROM = { x: 100, y: 50, side: Position.Right };
const TO = { x: 300, y: 80, side: Position.Left };

const MANY_FROM = 'M100 44 L112 50 L100 56';
const ONE_FROM = 'M112 44 L112 56';
const MANY_TO = 'M300 74 L288 80 L300 86';
const ONE_TO = 'M288 74 L288 86';

describe('getDiagramNodes', () => {
  test('uses the given position of each entity', () => {
    const [node] = getDiagramNodes(MODEL.entities, { 'public.users': { x: 10, y: 20 } });

    expect(node).toMatchObject({ id: 'public.users', position: { x: 10, y: 20 } });
  });
});

describe('getDiagramEdges', () => {
  test('joins the first property of each list of a composite FK', () => {
    expect(getDiagramEdges(MODEL.relations, new Set(), null, null)[0]).toMatchObject({
      source: 'public.orders',
      sourceHandle: 'user_id',
      target: 'public.users',
      targetHandle: 'id'
    });
  });

  test('hides the relations to a hub until the hub or the FK table has the focus', () => {
    const hubs = new Set(['public.users']);
    const getTargets = (focusedId: string | null) =>
      getDiagramEdges(MODEL.relations, hubs, getDiagramFocus(MODEL.relations, focusedId), null).map(
        edge => edge.target
      );

    expect(getTargets(null)).toEqual(['public.orders']);
    expect(getTargets('billing.invoices')).toEqual(['public.orders']);
    expect(getTargets('public.users')).toEqual(['public.users', 'public.orders']);
    expect(getTargets('public.orders')).toEqual(['public.users', 'public.orders']);
  });

  test('dims the relations that do not touch the focused table', () => {
    const focus = getDiagramFocus(MODEL.relations, 'public.users');

    expect(
      getDiagramEdges(MODEL.relations, new Set(), focus, null).map(({ data }) => data)
    ).toEqual([
      { type: 'MANY_TO_ONE', isFocused: true, isDimmed: false },
      { type: 'MANY_TO_ONE', isFocused: false, isDimmed: true }
    ]);
  });
});

describe('getDiagramEdges with a search', () => {
  test('dims the relations that touch a table that does not match', () => {
    const getDimmed = (matchedIds: string[]) =>
      getDiagramEdges(MODEL.relations, new Set(), null, new Set(matchedIds)).map(
        ({ data }) => data.isDimmed
      );

    expect(getDimmed(['public.users'])).toEqual([true, true]);
    expect(getDimmed(['public.users', 'public.orders'])).toEqual([false, true]);
  });

  test('dims a focused relation when the search dims it', () => {
    const focus = getDiagramFocus(MODEL.relations, 'public.users');

    expect(
      getDiagramEdges(MODEL.relations, new Set(), focus, new Set(['public.users']))[0]?.data
    ).toEqual({ type: 'MANY_TO_ONE', isFocused: true, isDimmed: true });
  });
});

describe('getDiagramMatches', () => {
  test('matches the table name without distinguishing case and ignores the schema', () => {
    expect(getDiagramMatches(MODEL.entities, ' USER ')).toEqual(new Set(['public.users']));
    expect(getDiagramMatches(MODEL.entities, 'public')).toEqual(new Set());
  });

  test('returns nothing without a search', () => {
    expect(getDiagramMatches(MODEL.entities, '  ')).toBeNull();
  });
});

describe('getDiagramFocus', () => {
  test('returns the table and its neighbors', () => {
    expect(getDiagramFocus(MODEL.relations, 'public.users')).toEqual({
      entityId: 'public.users',
      entityIds: new Set(['public.users', 'public.orders'])
    });
  });

  test('returns nothing without a focused table', () => {
    expect(getDiagramFocus(MODEL.relations, null)).toBeNull();
  });
});

describe('getDiagramHubs', () => {
  const getModel = (sources: number, others: number, hub = 'public.hub'): DiagramModel => {
    const sourceEntities = Array.from({ length: sources }, (_, index) =>
      entity('public', `source_${index}`)
    );
    const otherEntities = Array.from({ length: others }, (_, index) =>
      entity('public', `other_${index}`)
    );

    return {
      entities: [entity('public', 'hub'), ...sourceEntities, ...otherEntities],
      relations: sourceEntities.map(({ id }) => relation(id, hub))
    };
  };

  test('returns a table referenced by 8 tables and by 25 % of the model', () => {
    expect(getDiagramHubs(getModel(8, 23))).toEqual(new Set(['public.hub']));
  });

  test('does not return a table referenced by less than 8 tables', () => {
    expect(getDiagramHubs(getModel(7, 0)).size).toBe(0);
  });

  test('does not return a table referenced by less than 25 % of the model', () => {
    expect(getDiagramHubs(getModel(8, 24)).size).toBe(0);
  });

  test('counts each table once and ignores the table itself', () => {
    const model = getModel(7, 0);
    const [, source] = model.entities;
    const relations = [
      ...model.relations,
      relation(source?.id ?? '', 'public.hub'),
      relation('public.hub', 'public.hub')
    ];

    expect(getDiagramHubs({ ...model, relations }).size).toBe(0);
  });
});

describe('getHighlightParts', () => {
  test('marks every match without distinguishing case', () => {
    expect(getHighlightParts('User_users', 'USER')).toEqual([
      { text: 'User', isMatch: true },
      { text: '_', isMatch: false },
      { text: 'user', isMatch: true },
      { text: 's', isMatch: false }
    ]);
  });

  test('marks nothing without a search or a match', () => {
    expect(getHighlightParts('users', '  ')).toEqual([{ text: 'users', isMatch: false }]);
    expect(getHighlightParts('users', 'orders')).toEqual([{ text: 'users', isMatch: false }]);
  });
});

describe('getRelationEndsPath', () => {
  test.each([
    ['MANY_TO_ONE', MANY_FROM, ONE_TO],
    ['ONE_TO_ONE', ONE_FROM, ONE_TO],
    ['MANY_TO_MANY', MANY_FROM, MANY_TO]
  ] as const)('draws the ends of %s', (type, from, to) => {
    expect(getRelationEndsPath(type, FROM, TO)).toBe(`${from} ${to}`);
  });
});

describe('getDiagramSchemas', () => {
  test('returns each schema once', () => {
    expect(getDiagramSchemas(MODEL)).toEqual(['public', 'billing']);
  });
});

describe('getDiagramSchemaModel', () => {
  test('keeps the tables of the schema and the relations between them', () => {
    const { entities, relations } = getDiagramSchemaModel(MODEL, 'public');

    expect(entities.map(({ id }) => id)).toEqual(['public.users', 'public.orders']);
    expect(relations.map(({ fromEntityId }) => fromEntityId)).toEqual(['public.orders']);
  });
});

describe('getReferencedEntityId', () => {
  test('uses the first relation of the property, also in a composite FK', () => {
    const relations = [
      relation('public.orders', 'public.users'),
      relation('public.orders', 'billing.invoices')
    ];

    expect(getReferencedEntityId(relations, 'public.orders', 'tenant_id')).toBe('public.users');
  });

  test('returns nothing without a relation', () => {
    expect(getReferencedEntityId(MODEL.relations, 'public.users', 'id')).toBeUndefined();
  });
});

describe('getRelatedEntities', () => {
  const model: DiagramModel = {
    entities: [
      entity('public', 'orders'),
      entity('public', 'users'),
      entity('public', 'carts'),
      entity('public', 'addresses'),
      entity('billing', 'invoices')
    ],
    relations: [
      relation('public.orders', 'public.users'),
      { ...relation('public.orders', 'public.users'), id: 'second' },
      relation('public.orders', 'public.addresses'),
      relation('public.orders', 'public.orders'),
      relation('public.carts', 'public.orders'),
      relation('billing.invoices', 'public.orders')
    ]
  };

  test('lists both directions in order, once per group and without the table itself', () => {
    expect(getRelatedEntities(model, 'public.orders')).toEqual({
      outgoing: [
        { id: 'public.addresses', label: 'addresses' },
        { id: 'public.users', label: 'users' }
      ],
      incoming: [
        { id: 'billing.invoices', label: 'billing.invoices' },
        { id: 'public.carts', label: 'carts' }
      ]
    });
  });

  test('shows the schema compared to the schema of the table', () => {
    expect(getRelatedEntities(model, 'billing.invoices').outgoing).toEqual([
      { id: 'public.orders', label: 'public.orders' }
    ]);
  });

  test('returns empty groups for a table without relations', () => {
    const empty = { ...model, relations: [] };

    expect(getRelatedEntities(empty, 'public.orders')).toEqual({ outgoing: [], incoming: [] });
  });
});

describe('advanceDiagramTrail', () => {
  test('adds a step from the current table of the trail', () => {
    expect(advanceDiagramTrail(['a', 'b'], 'b', 'c')).toEqual(['a', 'b', 'c']);
  });

  test('does not add a step for a FK to the same table', () => {
    expect(advanceDiagramTrail(['a', 'b'], 'b', 'b')).toEqual(['a', 'b']);
    expect(advanceDiagramTrail([], 'a', 'a')).toEqual([]);
  });

  test('starts a new trail from another table', () => {
    expect(advanceDiagramTrail(['a', 'b'], 'x', 'y')).toEqual(['x', 'y']);
    expect(advanceDiagramTrail([], 'a', 'b')).toEqual(['a', 'b']);
  });
});

describe('getDiagramCenter', () => {
  const users = entity('public', 'users');

  test('returns the center of the box and keeps the zoom when the box fits', () => {
    expect(getDiagramCenter(users, { x: 100, y: 50 }, 1, { width: 1200, height: 800 })).toEqual({
      x: 244,
      y: 83,
      zoom: 1
    });
  });

  test('reduces the zoom only when the box does not fit', () => {
    const { zoom } = getDiagramCenter(users, { x: 0, y: 0 }, 2, { width: 348, height: 800 });

    expect(zoom).toBe(1);
  });
});
