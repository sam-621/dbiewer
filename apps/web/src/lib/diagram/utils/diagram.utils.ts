import { type Edge, type Node, Position } from '@xyflow/react';

import {
  DIAGRAM_ENTITY_WIDTH,
  DIAGRAM_HEADER_HEIGHT,
  DIAGRAM_ROW_HEIGHT
} from '../constants/diagram-sizes';

export type DiagramProperty = {
  name: string;
  type: string;
  default?: string | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

export type DiagramEntity = {
  id: string;
  schema: string;
  name: string;
  properties: DiagramProperty[];
};

export type DiagramRelationType = 'ONE_TO_ONE' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export type DiagramRelation = {
  id: string;
  type: DiagramRelationType;
  fromEntityId: string;
  fromProperties: string[];
  toEntityId: string;
  toProperties: string[];
};

export type DiagramModel = { entities: DiagramEntity[]; relations: DiagramRelation[] };

export type DiagramPosition = { x: number; y: number };

export type DiagramPositions = Record<string, DiagramPosition>;

export type DiagramEntityNode = Node<{ entity: DiagramEntity }, 'entity'>;

type DiagramRelationEdgeData = {
  type: DiagramRelationType;
  isFocused: boolean;
  isDimmed: boolean;
};

export type DiagramRelationEdge = Edge<DiagramRelationEdgeData, 'relation'> & {
  data: DiagramRelationEdgeData;
};

export type DiagramRelatedEntity = { id: string; label: string };

export type DiagramFocus = { entityId: string; entityIds: Set<string> };

const ENTITY_BORDER = 2;
const MARKER_LENGTH = 12;
const MARKER_HALF_WIDTH = 6;
const HUB_MIN_SOURCES = 8;
const HUB_MIN_SOURCE_RATIO = 0.25;
const CENTER_PADDING = 60;

export const getEntityHeight = (entity: DiagramEntity) =>
  DIAGRAM_HEADER_HEIGHT + entity.properties.length * DIAGRAM_ROW_HEIGHT + ENTITY_BORDER;

export const getDiagramCenter = (
  entity: DiagramEntity,
  position: DiagramPosition,
  zoom: number,
  viewport: { width: number; height: number }
) => {
  const height = getEntityHeight(entity);

  return {
    x: position.x + DIAGRAM_ENTITY_WIDTH / 2,
    y: position.y + height / 2,
    zoom: Math.min(
      zoom,
      viewport.width / (DIAGRAM_ENTITY_WIDTH + CENTER_PADDING),
      viewport.height / (height + CENTER_PADDING)
    )
  };
};

export const getRelatedEntities = ({ entities, relations }: DiagramModel, entityId: string) => {
  const entityById = new Map(entities.map(entity => [entity.id, entity]));
  const schema = entityById.get(entityId)?.schema;

  const getList = (ids: string[]): DiagramRelatedEntity[] =>
    [...new Set(ids)]
      .filter(id => id !== entityId)
      .flatMap(id => {
        const related = entityById.get(id);
        if (!related) return [];

        const label =
          related.schema === schema ? related.name : `${related.schema}.${related.name}`;
        return [{ id, label }];
      })
      .sort((first, second) => first.label.localeCompare(second.label));

  return {
    outgoing: getList(
      relations
        .filter(relation => relation.fromEntityId === entityId)
        .map(relation => relation.toEntityId)
    ),
    incoming: getList(
      relations
        .filter(relation => relation.toEntityId === entityId)
        .map(relation => relation.fromEntityId)
    )
  };
};

export const advanceDiagramTrail = (trail: string[], fromId: string, toId: string) => {
  if (fromId === toId) return trail;

  return trail.at(-1) === fromId ? [...trail, toId] : [fromId, toId];
};

export const getReferencedEntityId = (
  relations: DiagramRelation[],
  entityId: string,
  propertyName: string
) =>
  relations.find(
    relation => relation.fromEntityId === entityId && relation.fromProperties.includes(propertyName)
  )?.toEntityId;

export const getDiagramNodes = (
  entities: DiagramEntity[],
  positions: DiagramPositions
): DiagramEntityNode[] =>
  entities.map(entity => ({
    id: entity.id,
    type: 'entity',
    position: positions[entity.id] ?? { x: 0, y: 0 },
    width: DIAGRAM_ENTITY_WIDTH,
    height: getEntityHeight(entity),
    data: { entity }
  }));

export const getDiagramHubs = ({ entities, relations }: DiagramModel) => {
  const sources = new Map(entities.map(entity => [entity.id, new Set<string>()]));

  relations
    .filter(relation => relation.fromEntityId !== relation.toEntityId)
    .forEach(relation => sources.get(relation.toEntityId)?.add(relation.fromEntityId));

  const minSources = Math.max(HUB_MIN_SOURCES, entities.length * HUB_MIN_SOURCE_RATIO);

  return new Set(
    [...sources].filter(([, entityIds]) => entityIds.size >= minSources).map(([id]) => id)
  );
};

const touchesEntity = (relation: DiagramRelation, entityId: string) =>
  relation.fromEntityId === entityId || relation.toEntityId === entityId;

export const getDiagramFocus = (
  relations: DiagramRelation[],
  entityId: string | null
): DiagramFocus | null => {
  if (!entityId) return null;

  const entityIds = relations
    .filter(relation => touchesEntity(relation, entityId))
    .flatMap(relation => [relation.fromEntityId, relation.toEntityId]);

  return { entityId, entityIds: new Set([entityId, ...entityIds]) };
};

export const getDiagramMatches = (entities: DiagramEntity[], search: string) => {
  const term = search.trim().toLowerCase();
  if (!term) return null;

  return new Set(
    entities.filter(entity => entity.name.toLowerCase().includes(term)).map(entity => entity.id)
  );
};

export const getDiagramEdges = (
  relations: DiagramRelation[],
  hubs: Set<string>,
  focus: DiagramFocus | null,
  matchedIds: Set<string> | null
): DiagramRelationEdge[] =>
  relations.flatMap(relation => {
    const isFocused = Boolean(focus && touchesEntity(relation, focus.entityId));

    if (hubs.has(relation.toEntityId) && !isFocused) return [];

    const isMatched =
      !matchedIds || (matchedIds.has(relation.fromEntityId) && matchedIds.has(relation.toEntityId));

    return [
      {
        id: relation.id,
        type: 'relation',
        source: relation.fromEntityId,
        sourceHandle: relation.fromProperties[0],
        target: relation.toEntityId,
        targetHandle: relation.toProperties[0],
        data: {
          type: relation.type,
          isFocused,
          isDimmed: (Boolean(focus) && !isFocused) || !isMatched
        }
      }
    ];
  });

export const getHighlightParts = (text: string, search: string) => {
  const term = search.trim().toLowerCase();
  if (!term) return [{ text, isMatch: false }];

  const lowerText = text.toLowerCase();
  const parts: { text: string; isMatch: boolean }[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(term);

  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), isMatch: false });
    cursor = index + term.length;
    parts.push({ text: text.slice(index, cursor), isMatch: true });
    index = lowerText.indexOf(term, cursor);
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), isMatch: false });

  return parts;
};

const getEndPath = (x: number, y: number, side: Position, isMany: boolean) => {
  const direction = side === Position.Right ? 1 : -1;
  const top = y - MARKER_HALF_WIDTH;
  const bottom = y + MARKER_HALF_WIDTH;
  const tip = x + direction * MARKER_LENGTH;

  return isMany ? `M${x} ${top} L${tip} ${y} L${x} ${bottom}` : `M${tip} ${top} L${tip} ${bottom}`;
};

type RelationEnd = { x: number; y: number; side: Position };

export const getRelationEndsPath = (
  type: DiagramRelationType,
  from: RelationEnd,
  to: RelationEnd
) =>
  [
    getEndPath(from.x, from.y, from.side, type !== 'ONE_TO_ONE'),
    getEndPath(to.x, to.y, to.side, type === 'MANY_TO_MANY')
  ].join(' ');

export const getDiagramSchemas = ({ entities }: DiagramModel) => [
  ...new Set(entities.map(entity => entity.schema))
];

export const getDiagramSchemaModel = (
  { entities, relations }: DiagramModel,
  schema: string | null
): DiagramModel => {
  const visibleEntities = entities.filter(entity => entity.schema === schema);
  const visibleIds = new Set(visibleEntities.map(entity => entity.id));

  return {
    entities: visibleEntities,
    relations: relations.filter(
      relation => visibleIds.has(relation.fromEntityId) && visibleIds.has(relation.toEntityId)
    )
  };
};
