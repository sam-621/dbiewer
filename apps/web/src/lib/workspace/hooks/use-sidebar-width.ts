import { useState } from 'react';

import { Logger } from '@/shared/utils/logger';

const SIDEBAR_WIDTH_STORAGE_KEY = 'dbiewer:sidebar-width';

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 520;
export const SIDEBAR_DEFAULT_WIDTH = 256;

export const clampSidebarWidth = (width: number) =>
  Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));

export const useSidebarWidth = () => {
  const [width, setWidth] = useState(getStoredSidebarWidth);

  const changeWidth = (nextWidth: number) => {
    const clamped = clampSidebarWidth(nextWidth);
    setWidth(clamped);
    storeSidebarWidth(clamped);
  };

  return { width, changeWidth };
};

const getStoredSidebarWidth = () => {
  try {
    const stored = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    return stored ? clampSidebarWidth(stored) : SIDEBAR_DEFAULT_WIDTH;
  } catch (error) {
    Logger.error(error);
    return SIDEBAR_DEFAULT_WIDTH;
  }
};

const storeSidebarWidth = (width: number) => {
  try {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
  } catch (error) {
    Logger.error(error);
  }
};
