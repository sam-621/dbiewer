import { useState } from 'react';

import { Logger } from '@/shared/utils/logger';

export const useDraftSql = (connectionId: string, tabKey: string) => {
  const [initialSql] = useState(() => getStoredDraftSql(connectionId, tabKey));

  const changeDraftSql = (sql: string) => storeDraftSql(connectionId, tabKey, sql);

  return { initialSql, changeDraftSql };
};

export const removeStoredDraftSql = (connectionId: string, tabKey: string) => {
  try {
    localStorage.removeItem(getDraftStorageKey(connectionId, tabKey));
  } catch (error) {
    Logger.error(error);
  }
};

const getDraftStorageKey = (connectionId: string, tabKey: string) =>
  `dbiewer:draft:${connectionId}:${tabKey}`;

const getStoredDraftSql = (connectionId: string, tabKey: string) => {
  try {
    return localStorage.getItem(getDraftStorageKey(connectionId, tabKey)) ?? '';
  } catch (error) {
    Logger.error(error);
    return '';
  }
};

const storeDraftSql = (connectionId: string, tabKey: string, sql: string) => {
  try {
    localStorage.setItem(getDraftStorageKey(connectionId, tabKey), sql);
  } catch (error) {
    Logger.error(error);
  }
};
