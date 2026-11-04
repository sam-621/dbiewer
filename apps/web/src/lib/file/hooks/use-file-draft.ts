import { useState } from 'react';

import { Logger } from '@/shared/utils/logger';

export const useFileDraft = (connectionId: string, tabKey: string) => {
  const [storedContent] = useState(() => getStoredDraft(connectionId, tabKey));

  const changeDraft = (content: string) => storeDraft(connectionId, tabKey, content);
  const removeDraft = () => removeStoredDraft(connectionId, tabKey);

  return { storedContent, changeDraft, removeDraft };
};

export const removeStoredDraft = (connectionId: string, tabKey: string) => {
  try {
    localStorage.removeItem(getDraftStorageKey(connectionId, tabKey));
  } catch (error) {
    Logger.error(error);
  }
};

const getDraftStorageKey = (connectionId: string, tabKey: string) =>
  `dbiewer:draft:${connectionId}:${tabKey}`;

const getStoredDraft = (connectionId: string, tabKey: string) => {
  try {
    return localStorage.getItem(getDraftStorageKey(connectionId, tabKey));
  } catch (error) {
    Logger.error(error);
    return null;
  }
};

const storeDraft = (connectionId: string, tabKey: string, content: string) => {
  try {
    localStorage.setItem(getDraftStorageKey(connectionId, tabKey), content);
  } catch (error) {
    Logger.error(error);
  }
};
