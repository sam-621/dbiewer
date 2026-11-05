import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  applyNodeChanges,
  Background,
  type NodeChange,
  type NodeTypes,
  ReactFlow
} from '@xyflow/react';

import { useStableCallback } from '@/shared/hooks/use-stable-callback';

import { DiagramFocusContext } from '../../contexts/diagram-focus-context';
import { DiagramNavigationContext } from '../../contexts/diagram-navigation-context';
import { DiagramSearchContext } from '../../contexts/diagram-search-context';
import { DiagramViewContext } from '../../contexts/diagram-view-context';
import { useCenterDiagramEntity } from '../../hooks/use-center-diagram-entity';
import { usePreventPageZoom } from '../../hooks/use-prevent-page-zoom';
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
import { createDiagramViewStore } from '../../utils/diagram-view-store.utils';

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

const PRO_OPTIONS = { hideAttribution: true };

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
  const [store] = useState(() => createDiagramViewStore({ jumpedId: initialCenterId }));
  const jumpTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  usePreventPageZoom();

  const highlightJump = useStableCallback((id: string) => {
    store.changeView({ jumpedId: id });
    clearTimeout(jumpTimeout.current);
    jumpTimeout.current = setTimeout(
      () => store.changeView({ jumpedId: null }),
      JUMP_HIGHLIGHT_DURATION
    );
  });

  const goToEntity = useStableCallback((id: string) => {
    if (!entities.some(entity => entity.id === id)) {
      onHiddenEntityRequest(id);
      return;
    }

    centerEntity(id);
    highlightJump(id);
  });

  const goToRelatedEntity = useStableCallback((entityId: string, relatedId: string) => {
    onTrailChange(advanceDiagramTrail(trail, entityId, relatedId));
    goToEntity(relatedId);
  });

  const goToReferencedEntity = useStableCallback((entityId: string, propertyName: string) => {
    const referencedId = getReferencedEntityId(fullModel.relations, entityId, propertyName);
    if (referencedId) goToRelatedEntity(entityId, referencedId);
  });

  const goBack = useStableCallback(() => {
    const backId = trail.at(-2);
    if (!backId) return;

    onTrailChange(trail.slice(0, -1));
    goToEntity(backId);
  });

  const clearTrail = useStableCallback(() => onTrailChange([]));

  const navigationContext = useMemo(
    () => ({ fullModel, goToReferencedEntity, goToRelatedEntity, goBack, clearTrail }),
    [fullModel, goToReferencedEntity, goToRelatedEntity, goBack, clearTrail]
  );

  const trailCurrentId = trail.at(-1) ?? null;
  const trailBackId = trail.at(-2);
  const trailBackName = fullModel.entities.find(entity => entity.id === trailBackId)?.name ?? null;

  useLayoutEffect(() => {
    store.changeView({
      trailCurrentId: trailBackName ? trailCurrentId : null,
      trailBackName
    });
  }, [store, trailCurrentId, trailBackName]);

  useEffect(() => {
    if (initialCenterId) highlightJump(initialCenterId);

    return () => clearTimeout(jumpTimeout.current);
  }, [initialCenterId, highlightJump]);

  if (source.entities !== entities || source.positions !== positions) {
    setSource({ entities, positions });
    setNodes(current => getDiagramNodes(entities, positions, current));
  }

  const changeNodes = useCallback(
    (changes: NodeChange<DiagramEntityFlowNode>[]) =>
      setNodes(current => applyNodeChanges(changes, current)),
    []
  );

  const centerInitialEntity = useStableCallback(() => {
    if (initialCenterId) centerEntity(initialCenterId);
  });

  const savePosition = useStableCallback((_event: unknown, node: DiagramEntityFlowNode) =>
    onPositionChange(node.id, node.position)
  );

  const hoverNode = useStableCallback((_event: unknown, node: DiagramEntityFlowNode) => {
    if (isFocusEnabled) setHoveredId(node.id);
  });

  const leaveNode = useStableCallback(() => {
    if (isFocusEnabled) setHoveredId(null);
  });

  const pinNode = useStableCallback((_event: unknown, node: DiagramEntityFlowNode) => {
    if (isFocusEnabled) onPinnedIdChange(node.id);
  });

  const unpinNode = useStableCallback(() => {
    if (isFocusEnabled) onPinnedIdChange(null);
  });

  return (
    <DiagramFocusContext value={focus}>
      <DiagramSearchContext value={searchContext}>
        <DiagramNavigationContext value={navigationContext}>
          <DiagramViewContext value={store}>
            <ReactFlow
              proOptions={PRO_OPTIONS}
              className="[--xy-edge-stroke:var(--muted-foreground)]"
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              minZoom={MIN_ZOOM}
              panOnScroll
              fitView={!initialCenterId}
              onInit={centerInitialEntity}
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
              onNodeDragStop={savePosition}
              onNodeMouseEnter={hoverNode}
              onNodeMouseLeave={leaveNode}
              onNodeClick={pinNode}
              onPaneClick={unpinNode}
            >
              <Background color="var(--border)" />
            </ReactFlow>
          </DiagramViewContext>
        </DiagramNavigationContext>
      </DiagramSearchContext>
    </DiagramFocusContext>
  );
};
