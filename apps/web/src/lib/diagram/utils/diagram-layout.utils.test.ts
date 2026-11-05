import { describe, expect, test } from 'vitest';

import { DIAGRAM_ENTITY_WIDTH } from '../constants/diagram-sizes';

import {
  type DiagramEntity,
  type DiagramModel,
  type DiagramRelation,
  getEntityHeight
} from './diagram.utils';
import { getDiagramLayout } from './diagram-layout.utils';

const entity = (index: number): DiagramEntity => ({
  id: `public.t${index}`,
  schema: 'public',
  name: `t${index}`,
  properties: Array.from({ length: 3 + ((index * 7) % 14) }, (_, property) => ({
    name: `c${property}`,
    type: 'uuid',
    isNullable: false,
    isPrimaryKey: property === 0,
    isForeignKey: false
  }))
});

const relation = (from: number, to: number): DiagramRelation => ({
  id: `public.t${from}.fk_${to}`,
  type: 'MANY_TO_ONE',
  fromEntityId: `public.t${from}`,
  fromProperties: ['c0'],
  toEntityId: `public.t${to}`,
  toProperties: ['c0']
});

const ISOLATED_EVERY = 7;

const MODEL: DiagramModel = {
  entities: Array.from({ length: 40 }, (_, index) => entity(index)),
  relations: Array.from({ length: 40 }, (_, index) => index)
    .filter(index => index > 0 && index % ISOLATED_EVERY !== 0)
    .map(index => relation(index, Math.floor(index / 3)))
};

const getBoxes = (model: DiagramModel) => {
  const positions = getDiagramLayout(model);

  return model.entities.map(current => {
    const { x, y } = positions[current.id] ?? { x: Number.NaN, y: Number.NaN };

    return {
      id: current.id,
      left: x,
      top: y,
      right: x + DIAGRAM_ENTITY_WIDTH,
      bottom: y + getEntityHeight(current)
    };
  });
};

type Box = ReturnType<typeof getBoxes>[number];

const getDistance = (first: Box, second: Box) =>
  Math.hypot(
    (first.left + first.right - second.left - second.right) / 2,
    (first.top + first.bottom - second.top - second.bottom) / 2
  );

const getAverage = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

describe('getDiagramLayout', () => {
  test('returns a finite position for every entity', () => {
    const positions = getDiagramLayout(MODEL);

    expect(Object.keys(positions)).toHaveLength(MODEL.entities.length);
    expect(Object.values(positions).every(({ x, y }) => isFinite(x) && isFinite(y))).toBe(true);
  });

  test('returns nothing for an empty model', () => {
    expect(getDiagramLayout({ entities: [], relations: [] })).toEqual({});
  });

  test('does not overlap any box', () => {
    const boxes = getBoxes(MODEL);

    const overlaps = boxes.flatMap((first, index) =>
      boxes
        .slice(index + 1)
        .filter(
          second =>
            first.left < second.right &&
            second.left < first.right &&
            first.top < second.bottom &&
            second.top < first.bottom
        )
    );

    expect(overlaps).toEqual([]);
  });

  test('returns the same positions for the same model', () => {
    expect(getDiagramLayout(MODEL)).toEqual(getDiagramLayout(MODEL));
  });

  test('places related tables closer than unrelated ones', () => {
    const boxes = getBoxes(MODEL);
    const boxById = new Map(boxes.map(box => [box.id, box]));
    const related = new Set(
      MODEL.relations.flatMap(({ fromEntityId, toEntityId }) => [
        `${fromEntityId}:${toEntityId}`,
        `${toEntityId}:${fromEntityId}`
      ])
    );

    const relatedDistances = MODEL.relations.flatMap(({ fromEntityId, toEntityId }) => {
      const from = boxById.get(fromEntityId);
      const to = boxById.get(toEntityId);

      return from && to ? [getDistance(from, to)] : [];
    });
    const unrelatedDistances = boxes.flatMap((first, index) =>
      boxes
        .slice(index + 1)
        .filter(second => !related.has(`${first.id}:${second.id}`))
        .map(second => getDistance(first, second))
    );

    expect(getAverage(relatedDistances)).toBeLessThan(getAverage(unrelatedDistances));
  });

  test('spreads the tables close to a wide screen instead of a tall column', () => {
    const boxes = getBoxes(MODEL);
    const width =
      Math.max(...boxes.map(box => box.right)) - Math.min(...boxes.map(box => box.left));
    const height =
      Math.max(...boxes.map(box => box.bottom)) - Math.min(...boxes.map(box => box.top));

    expect(width / height).toBeGreaterThan(1.2);
    expect(width / height).toBeLessThan(2.5);
  });

  test('places tables without relations in the same packing', () => {
    const entities = Array.from({ length: 20 }, (_, index) => entity(index));
    const boxes = getBoxes({ entities, relations: [] });

    expect(new Set(boxes.map(box => box.left)).size).toBeGreaterThan(1);
    expect(new Set(boxes.map(box => box.top)).size).toBeGreaterThan(1);
  });

  test('ignores the relations to a hub to separate the components', () => {
    const entities = Array.from({ length: 12 }, (_, index) => entity(index));
    const hubRelations = Array.from({ length: 10 }, (_, index) => relation(index + 1, 0));
    const withHub = getDiagramLayout({ entities, relations: hubRelations });
    const withoutRelations = getDiagramLayout({ entities, relations: [] });

    expect(withHub).toEqual(withoutRelations);
  });

  test('uses the height of each box', () => {
    const tall = entity(1);
    const short = { ...tall, properties: tall.properties.slice(0, 1) };

    const boxes = getBoxes({ entities: [short, entity(2)], relations: [] });

    expect(boxes[0]?.bottom).toBe((boxes[0]?.top ?? 0) + getEntityHeight(short));
    expect(getEntityHeight(short)).toBeLessThan(getEntityHeight(tall));
  });

  test('handles tables that reference themselves and cycles', () => {
    const positions = getDiagramLayout({
      entities: [entity(0), entity(1)],
      relations: [relation(0, 0), relation(0, 1), relation(1, 0)]
    });

    expect(Object.keys(positions)).toHaveLength(2);
  });
});
