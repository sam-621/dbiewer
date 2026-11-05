import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyNodeChanges,
  Background,
  type NodeChange,
  type NodeTypes,
  ReactFlow
} from '@xyflow/react';

import { DiagramFocusContext } from '../../contexts/diagram-focus-context';
import { DiagramJumpContext } from '../../contexts/diagram-jump-context';
import { DiagramNavigationContext } from '../../contexts/diagram-navigation-context';
import { DiagramSearchContext } from '../../contexts/diagram-search-context';
import { DiagramTrailContext } from '../../contexts/diagram-trail-context';
import { useCenterDiagramEntity } from '../../hooks/use-center-diagram-entity';
import {
  advanceDiagramTrail,
  type DiagramEntity,
  type DiagramEntityNode as DiagramEntityFlowNode,
  type DiagramModel,
  type DiagramPosition,
  type DiagramPositions,
  type DiagramRelation,
  getDiagramEdges,
  getDiagramFocus,
  getDiagramHubs,
  getDiagramMatches,
  getDiagramNodes,
  getReferencedEntityId
} from '../../utils/diagram.utils';

import { DiagramEntityNode } from './diagram-entity-node/diagram-entity-node';
import { DiagramRelationEdge } from './diagram-relation-edge/diagram-relation-edge';

import '@xyflow/react/dist/base.css';

const NODE_TYPES: NodeTypes = { entity: DiagramEntityNode };

const EDGE_TYPES = { relation: DiagramRelationEdge };

const MIN_ZOOM = 0.1;

const JUMP_HIGHLIGHT_DURATION = 1500;

type Props = {
  entities: DiagramEntity[];
  relations: DiagramRelation[];
  fullModel: DiagramModel;
  positions: DiagramPositions;
  initialCenterId: string | null;
  trail: string[];
  onTrailChange: (trail: string[]) => void;
  search: string;
  isFocusEnabled: boolean;
  pinnedId: string | null;
  onPinnedIdChange: (id: string | null) => void;
  onHiddenEntityRequest: (id: string) => void;
  onPositionChange: (id: string, position: DiagramPosition) => void;
};

export const Diagram = ({
  entities,
  relations,
  fullModel,
  positions,
  initialCenterId,
  trail,
  onTrailChange,
  search,
  isFocusEnabled,
  pinnedId,
  onPinnedIdChange,
  onHiddenEntityRequest,
  onPositionChange
}: Props) => {
  const [source, setSource] = useState({ entities, positions });
  const [nodes, setNodes] = useState(() => getDiagramNodes(entities, positions));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [jump, setJump] = useState(() => (initialCenterId ? { id: initialCenterId } : null));

  const isPinnedVisible = entities.some(entity => entity.id === pinnedId);
  const activeId = isPinnedVisible ? pinnedId : hoveredId;
  const focusedId = isFocusEnabled ? activeId : null;
  const hubs = useMemo(() => getDiagramHubs({ entities, relations }), [entities, relations]);
  const focus = useMemo(() => getDiagramFocus(relations, focusedId), [relations, focusedId]);
  const searchContext = useMemo(
    () => ({ search, matchedIds: getDiagramMatches(entities, search) }),
    [entities, search]
  );
  const edges = useMemo(
    () => getDiagramEdges(relations, hubs, focus, searchContext.matchedIds),
    [relations, hubs, focus, searchContext]
  );

  const centerEntity = useCenterDiagramEntity(entities, positions);
  const goToEntity = useCallback(
    (id: string) => {
      if (!entities.some(entity => entity.id === id)) {
        onHiddenEntityRequest(id);
        return;
      }

      centerEntity(id);
      setJump({ id });
    },
    [entities, centerEntity, onHiddenEntityRequest]
  );
  const navigationContext = useMemo(() => {
    const goToRelatedEntity = (entityId: string, relatedId: string) => {
      onTrailChange(advanceDiagramTrail(trail, entityId, relatedId));
      goToEntity(relatedId);
    };

    return {
      fullModel,
      goToRelatedEntity,
      goToReferencedEntity: (entityId: string, propertyName: string) => {
        const referencedId = getReferencedEntityId(fullModel.relations, entityId, propertyName);
        if (referencedId) goToRelatedEntity(entityId, referencedId);
      }
    };
  }, [fullModel, trail, onTrailChange, goToEntity]);
  const trailContext = useMemo(() => {
    const currentId = trail.at(-1);
    const backId = trail.at(-2);
    const back = fullModel.entities.find(entity => entity.id === backId);
    if (!currentId || !back) return null;

    return {
      currentId,
      backName: back.name,
      goBack: () => {
        onTrailChange(trail.slice(0, -1));
        goToEntity(back.id);
      },
      clear: () => onTrailChange([])
    };
  }, [fullModel, trail, onTrailChange, goToEntity]);

  useEffect(() => {
    if (!jump) return;

    const timeout = setTimeout(() => setJump(null), JUMP_HIGHLIGHT_DURATION);

    return () => clearTimeout(timeout);
  }, [jump]);

  if (source.entities !== entities || source.positions !== positions) {
    setSource({ entities, positions });
    setNodes(getDiagramNodes(entities, positions));
  }

  const changeNodes = (changes: NodeChange<DiagramEntityFlowNode>[]) =>
    setNodes(current => applyNodeChanges(changes, current));

  return (
    <DiagramFocusContext value={focus}>
      <DiagramSearchContext value={searchContext}>
        <DiagramNavigationContext value={navigationContext}>
          <DiagramTrailContext value={trailContext}>
            <DiagramJumpContext value={jump?.id ?? null}>
              <ReactFlow
                className="[--xy-attribution-background-color:transparent] [--xy-edge-stroke:var(--muted-foreground)]"
                nodes={nodes}
                edges={edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                minZoom={MIN_ZOOM}
                panOnScroll
                fitView={!initialCenterId}
                onInit={() => initialCenterId && centerEntity(initialCenterId)}
                nodesConnectable={false}
                edgesReconnectable={false}
                elementsSelectable={false}
                nodesFocusable={false}
                edgesFocusable={false}
                disableKeyboardA11y
                deleteKeyCode={null}
                selectionKeyCode={null}
                multiSelectionKeyCode={null}
                onNodesChange={changeNodes}
                onNodeDragStop={(_event, node) => onPositionChange(node.id, node.position)}
                onNodeMouseEnter={(_event, node) => setHoveredId(node.id)}
                onNodeMouseLeave={() => setHoveredId(null)}
                onNodeClick={(_event, node) => isFocusEnabled && onPinnedIdChange(node.id)}
                onPaneClick={() => isFocusEnabled && onPinnedIdChange(null)}
              >
                <Background color="var(--border)" />
              </ReactFlow>
            </DiagramJumpContext>
          </DiagramTrailContext>
        </DiagramNavigationContext>
      </DiagramSearchContext>
    </DiagramFocusContext>
  );
};
