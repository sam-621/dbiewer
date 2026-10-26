import { useState } from 'react';

import { applyTheme, getStoredTheme, storeTheme, type Theme } from '@/shared/utils/theme.utils';

export const useTheme = () => {
  const [theme, setThemeState] = useState(getStoredTheme);

  const setTheme = (next: Theme) => {
    storeTheme(next);
    applyTheme(next);
    setThemeState(next);
  };

  return { theme, setTheme };
};
