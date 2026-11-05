import {
  type Force,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum
} from 'd3-force';

import { DIAGRAM_ENTITY_WIDTH } from '../constants/diagram-sizes';

import {
  type DiagramEntity,
  type DiagramModel,
  type DiagramPositions,
  type DiagramRelation,
  getDiagramHubs,
  getEntityHeight
} from './diagram.utils';

type LayoutNode = {
  id: string;
  width: number;
  height: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type LayoutLink = SimulationLinkDatum<LayoutNode>;

type LayoutComponent = { nodes: LayoutNode[]; width: number; height: number };

const UNPLACED = Number.NaN;
const SIMULATION_TICKS = 300;
const LINK_DISTANCE = 420;
const REPULSION_STRENGTH = -2400;
const HORIZONTAL_GRAVITY = 0.03;
const VERTICAL_GRAVITY = 0.07;
const ENTITY_MARGIN = 48;
const OVERLAP_CLEARANCE = 1;
const COMPONENT_MARGIN = 96;
const TARGET_ASPECT_RATIO = 16 / 9;
const ROW_WIDTH_FACTORS = [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2];

const createNode = (entity: DiagramEntity): LayoutNode => ({
  id: entity.id,
  width: DIAGRAM_ENTITY_WIDTH,
  height: getEntityHeight(entity),
  x: UNPLACED,
  y: UNPLACED,
  vx: 0,
  vy: 0
});

const getOverlap = (first: LayoutNode, second: LayoutNode, dx: number, dy: number) => ({
  x: (first.width + second.width) / 2 + ENTITY_MARGIN - Math.abs(dx),
  y: (first.height + second.height) / 2 + ENTITY_MARGIN - Math.abs(dy)
});

const forceRectCollide = (): Force<LayoutNode, LayoutLink> => {
  let nodes: LayoutNode[] = [];

  const force = () => {
    nodes.forEach((first, index) => {
      nodes.slice(index + 1).forEach(second => {
        const dx = second.x + second.vx - first.x - first.vx;
        const dy = second.y + second.vy - first.y - first.vy;
        const overlap = getOverlap(first, second, dx, dy);

        if (overlap.x <= 0 || overlap.y <= 0) return;

        if (overlap.x < overlap.y) {
          const shift = (overlap.x / 2) * (dx < 0 ? -1 : 1);
          first.vx -= shift;
          second.vx += shift;
        } else {
          const shift = (overlap.y / 2) * (dy < 0 ? -1 : 1);
          first.vy -= shift;
          second.vy += shift;
        }
      });
    });
  };

  force.initialize = (next: LayoutNode[]) => {
    nodes = next;
  };

  return force;
};

const runSimulation = (nodes: LayoutNode[], links: LayoutLink[]) => {
  forceSimulation(nodes)
    .force(
      'link',
      forceLink<LayoutNode, LayoutLink>(links)
        .id(node => node.id)
        .distance(LINK_DISTANCE)
    )
    .force('charge', forceManyBody<LayoutNode>().strength(REPULSION_STRENGTH))
    .force('x', forceX<LayoutNode>(0).strength(HORIZONTAL_GRAVITY))
    .force('y', forceY<LayoutNode>(0).strength(VERTICAL_GRAVITY))
    .force('collide', forceRectCollide())
    .stop()
    .tick(SIMULATION_TICKS);
};

const removeOverlaps = (nodes: LayoutNode[]) => {
  const placed: LayoutNode[] = [];

  [...nodes]
    .sort((first, second) => first.x - second.x)
    .forEach(node => {
      let blocker = placed.find(isOverlapping(node));

      while (blocker) {
        node.x = blocker.x + (blocker.width + node.width) / 2 + ENTITY_MARGIN + OVERLAP_CLEARANCE;
        blocker = placed.find(isOverlapping(node));
      }

      placed.push(node);
    });
};

const isOverlapping = (node: LayoutNode) => (other: LayoutNode) => {
  const overlap = getOverlap(node, other, other.x - node.x, other.y - node.y);

  return overlap.x > 0 && overlap.y > 0;
};

const getComponents = (entities: DiagramEntity[], relations: DiagramRelation[]) => {
  const neighbors = new Map(entities.map(entity => [entity.id, [] as string[]]));

  relations.forEach(({ fromEntityId, toEntityId }) => {
    neighbors.get(fromEntityId)?.push(toEntityId);
    neighbors.get(toEntityId)?.push(fromEntityId);
  });

  const visited = new Set<string>();

  return entities.flatMap(entity => {
    if (visited.has(entity.id)) return [];

    const ids = new Set([entity.id]);
    ids.forEach(id => neighbors.get(id)?.forEach(neighbor => ids.add(neighbor)));
    ids.forEach(id => visited.add(id));

    return [ids];
  });
};

const layoutComponent = (
  ids: Set<string>,
  entities: DiagramEntity[],
  relations: DiagramRelation[]
): LayoutComponent => {
  const nodes = entities.filter(entity => ids.has(entity.id)).map(createNode);
  const links = relations
    .filter(({ fromEntityId, toEntityId }) => ids.has(fromEntityId) && fromEntityId !== toEntityId)
    .map(({ fromEntityId, toEntityId }) => ({ source: fromEntityId, target: toEntityId }));

  runSimulation(nodes, links);
  removeOverlaps(nodes);

  const left = Math.min(...nodes.map(node => node.x - node.width / 2));
  const top = Math.min(...nodes.map(node => node.y - node.height / 2));
  const right = Math.max(...nodes.map(node => node.x + node.width / 2));
  const bottom = Math.max(...nodes.map(node => node.y + node.height / 2));

  nodes.forEach(node => {
    node.x -= left + node.width / 2;
    node.y -= top + node.height / 2;
  });

  return { nodes, width: right - left, height: bottom - top };
};

const packInRows = (components: LayoutComponent[], rowWidth: number) => {
  const positions: DiagramPositions = {};
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  let width = 0;

  components.forEach(component => {
    if (x > 0 && x + component.width > rowWidth) {
      x = 0;
      y += rowHeight + COMPONENT_MARGIN;
      rowHeight = 0;
    }

    component.nodes.forEach(node => {
      positions[node.id] = { x: x + node.x, y: y + node.y };
    });

    width = Math.max(width, x + component.width);
    x += component.width + COMPONENT_MARGIN;
    rowHeight = Math.max(rowHeight, component.height);
  });

  return { positions, aspectRatio: width / (y + rowHeight) };
};

const getAspectRatioError = ({ aspectRatio }: { aspectRatio: number }) =>
  Math.abs(Math.log(aspectRatio / TARGET_ASPECT_RATIO));

const packComponents = (components: LayoutComponent[]): DiagramPositions => {
  const sorted = [...components].sort(
    (first, second) => second.width * second.height - first.width * first.height
  );
  const area = sorted.reduce(
    (total, { width, height }) => total + (width + COMPONENT_MARGIN) * (height + COMPONENT_MARGIN),
    0
  );
  const baseRowWidth = Math.sqrt(area * TARGET_ASPECT_RATIO);
  const packings = ROW_WIDTH_FACTORS.map(factor => packInRows(sorted, baseRowWidth * factor));
  const best = packings.reduce((current, packing) =>
    getAspectRatioError(packing) < getAspectRatioError(current) ? packing : current
  );

  return best.positions;
};

export const getDiagramLayout = (model: DiagramModel): DiagramPositions => {
  const { entities } = model;
  const hubs = getDiagramHubs(model);
  const relations = model.relations.filter(relation => !hubs.has(relation.toEntityId));

  return packComponents(
    getComponents(entities, relations).map(ids => layoutComponent(ids, entities, relations))
  );
};
