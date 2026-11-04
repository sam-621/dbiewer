import { useState } from 'react';
import { z } from 'zod';

import { Logger } from '@/shared/utils/logger';

const HISTORY_LIMIT = 50;

const HistorySchema = z.array(z.string());

export const useTableFilterHistory = (storageKey: string) => {
  const [history, setHistory] = useState(() => getStoredHistory(storageKey));

  const addToHistory = (text: string) => {
    const nextHistory = [text, ...history.filter(item => item !== text)].slice(0, HISTORY_LIMIT);

    setHistory(nextHistory);
    storeHistory(storageKey, nextHistory);
  };

  return { history, addToHistory };
};

const getStoredHistory = (storageKey: string) => {
  try {
    const parsed = HistorySchema.safeParse(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch (error) {
    Logger.error(error);
    return [];
  }
};

const storeHistory = (storageKey: string, history: string[]) => {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(history));
  } catch (error) {
    Logger.error(error);
  }
};
