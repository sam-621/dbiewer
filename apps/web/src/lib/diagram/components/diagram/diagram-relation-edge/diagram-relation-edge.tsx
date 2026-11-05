import type { CSSProperties } from 'react';
import { BaseEdge, type EdgeProps, getSmoothStepPath } from '@xyflow/react';

import {
  type DiagramRelationEdge as DiagramRelationFlowEdge,
  getRelationEndsPath
} from '../../../utils/diagram.utils';

const BORDER_RADIUS = 8;

const FOCUSED_STYLE: CSSProperties = { stroke: 'var(--primary)', strokeWidth: 2 };

const DIMMED_STYLE: CSSProperties = { opacity: 0.15 };

const getEdgeStyle = ({ isFocused, isDimmed }: DiagramRelationFlowEdge['data']) => {
  if (isDimmed) return DIMMED_STYLE;
  return isFocused ? FOCUSED_STYLE : undefined;
};

export const DiagramRelationEdge = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data
}: EdgeProps<DiagramRelationFlowEdge>) => {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: BORDER_RADIUS
  });
  const endsPath = getRelationEndsPath(
    data.type,
    { x: sourceX, y: sourceY, side: sourcePosition },
    { x: targetX, y: targetY, side: targetPosition }
  );

  return <BaseEdge path={`${path} ${endsPath}`} interactionWidth={0} style={getEdgeStyle(data)} />;
};
