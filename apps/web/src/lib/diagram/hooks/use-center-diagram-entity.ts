import { useCallback } from 'react';
import { useReactFlow, useStoreApi } from '@xyflow/react';

import {
  type DiagramEntity,
  type DiagramPositions,
  getDiagramCenter
} from '../utils/diagram.utils';

const CENTER_DURATION = 300;

export const useCenterDiagramEntity = (entities: DiagramEntity[], positions: DiagramPositions) => {
  const { getZoom, setCenter } = useReactFlow();
  const store = useStoreApi();

  return useCallback(
    (entityId: string) => {
      const entity = entities.find(current => current.id === entityId);
      const position = positions[entityId];
      if (!entity || !position) return;

      const { width, height } = store.getState();
      const { x, y, zoom } = getDiagramCenter(entity, position, getZoom(), { width, height });

      void setCenter(x, y, { zoom, duration: CENTER_DURATION });
    },
    [entities, positions, getZoom, setCenter, store]
  );
};
