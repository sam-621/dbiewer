import { useState } from 'react';
import { z } from 'zod';

import type { DiagramPositions } from '@/lib/diagram/utils/diagram.utils';
import { Logger } from '@/shared/utils/logger';

const PositionsSchema = z.record(z.string(), z.object({ x: z.number(), y: z.number() }));

export const useDiagramPositions = (connectionId: string) => {
  const [positions, setPositions] = useState(() => getStoredPositions(connectionId));

  const changePositions = (next: DiagramPositions) => {
    setPositions(next);
    storePositions(connectionId, next);
  };

  return { positions, changePositions, resetPositions: () => changePositions({}) };
};

const getStorageKey = (connectionId: string) => `dbiewer:diagram-positions:${connectionId}`;

const getStoredPositions = (connectionId: string): DiagramPositions => {
  try {
    const stored = localStorage.getItem(getStorageKey(connectionId));
    const parsed = PositionsSchema.safeParse(JSON.parse(stored ?? '{}'));
    return parsed.success ? parsed.data : {};
  } catch (error) {
    Logger.error(error);
    return {};
  }
};

const storePositions = (connectionId: string, positions: DiagramPositions) => {
  try {
    localStorage.setItem(getStorageKey(connectionId), JSON.stringify(positions));
  } catch (error) {
    Logger.error(error);
  }
};
