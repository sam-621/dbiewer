import {
  type Icon,
  type IconProps,
  MonitorIcon,
  MoonIcon,
  SunIcon
} from '@/shared/components/icons/icons';
import type { Theme } from '@/shared/utils/theme.utils';

const THEME_ICONS: Record<Theme, Icon> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon
};

export const ThemeIcon = ({ theme, ...props }: IconProps & { theme: Theme }) => {
  const ThemeOptionIcon = THEME_ICONS[theme];

  return <ThemeOptionIcon {...props} />;
};
