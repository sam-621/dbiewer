import { useState } from 'react';
import { z } from 'zod';

import { Logger } from '@/shared/utils/logger';

const ExpandedIdsSchema = z.array(z.string());

export const useExplorerExpanded = (connectionId: string) => {
  const [stored, setStored] = useState(() => ({
    connectionId,
    expandedIds: getStoredExpandedIds(connectionId)
  }));

  if (stored.connectionId !== connectionId) {
    setStored({ connectionId, expandedIds: getStoredExpandedIds(connectionId) });
  }

  const { expandedIds } = stored;

  const update = (next: string[]) => {
    setStored({ connectionId, expandedIds: next });
    storeExpandedIds(connectionId, next);
  };

  const changeExpanded = (id: string, isExpanded: boolean) =>
    update(isExpanded ? [...expandedIds, id] : expandedIds.filter(current => current !== id));

  return { expandedIds, changeExpanded, collapseAll: () => update([]) };
};

const getStorageKey = (connectionId: string) => `dbiewer:explorer-expanded:${connectionId}`;

const getStoredExpandedIds = (connectionId: string) => {
  try {
    const stored = localStorage.getItem(getStorageKey(connectionId));
    const parsed = ExpandedIdsSchema.safeParse(JSON.parse(stored ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch (error) {
    Logger.error(error);
    return [];
  }
};

const storeExpandedIds = (connectionId: string, expandedIds: string[]) => {
  try {
    localStorage.setItem(getStorageKey(connectionId), JSON.stringify(expandedIds));
  } catch (error) {
    Logger.error(error);
  }
};
