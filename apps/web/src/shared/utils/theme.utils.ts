export const THEMES = ['dark', 'light', 'system'] as const;

export type Theme = (typeof THEMES)[number];

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'dark';

export const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  return THEMES.find(theme => theme === stored) ?? DEFAULT_THEME;
};

export const storeTheme = (theme: Theme) => localStorage.setItem(THEME_STORAGE_KEY, theme);

export const applyTheme = (theme: Theme) => {
  const isDark =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';

  document.documentElement.classList.toggle('dark', isDark);
};
