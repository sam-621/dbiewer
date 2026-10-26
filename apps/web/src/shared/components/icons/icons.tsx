import type { ComponentProps, ComponentType, FC } from 'react';
import MoonSvg from 'amicons/icons/round/line/crescent.svg?react';
import MonitorSvg from 'amicons/icons/round/line/desktop.svg?react';
import GridSvg from 'amicons/icons/round/line/grid-2x2.svg?react';
import SunSvg from 'amicons/icons/round/line/sun.svg?react';
import MoonSolidSvg from 'amicons/icons/round/solid/crescent.svg?react';
import MonitorSolidSvg from 'amicons/icons/round/solid/desktop.svg?react';
import GridSolidSvg from 'amicons/icons/round/solid/grid-2x2.svg?react';
import SunSolidSvg from 'amicons/icons/round/solid/sun.svg?react';

export type IconProps = ComponentProps<'svg'> & {
  size?: number | string;
  variant?: 'line' | 'solid';
};

export type Icon = FC<IconProps>;

type Svg = ComponentType<ComponentProps<'svg'>>;

const createIcon = (LineSvg: Svg, SolidSvg: Svg): Icon =>
  function AmiconIcon({ size = 24, variant = 'line', ...props }: IconProps) {
    const Svg = variant === 'solid' ? SolidSvg : LineSvg;
    return <Svg width={size} height={size} aria-hidden="true" focusable="false" {...props} />;
  };

export const GridIcon = createIcon(GridSvg, GridSolidSvg);
export const MonitorIcon = createIcon(MonitorSvg, MonitorSolidSvg);
export const MoonIcon = createIcon(MoonSvg, MoonSolidSvg);
export const SunIcon = createIcon(SunSvg, SunSolidSvg);
