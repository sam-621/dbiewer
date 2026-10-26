import type { ComponentProps, ComponentType, FC } from 'react';
import CheckCircleSvg from 'amicons/icons/round/line/check-circle.svg?react';
import MoonSvg from 'amicons/icons/round/line/crescent.svg?react';
import MonitorSvg from 'amicons/icons/round/line/desktop.svg?react';
import EyeSvg from 'amicons/icons/round/line/eye.svg?react';
import EyeSlashSvg from 'amicons/icons/round/line/eye-slash.svg?react';
import GridSvg from 'amicons/icons/round/line/grid-2x2.svg?react';
import SunSvg from 'amicons/icons/round/line/sun.svg?react';
import XCircleSvg from 'amicons/icons/round/line/x-circle.svg?react';
import CheckCircleSolidSvg from 'amicons/icons/round/solid/check-circle.svg?react';
import MoonSolidSvg from 'amicons/icons/round/solid/crescent.svg?react';
import MonitorSolidSvg from 'amicons/icons/round/solid/desktop.svg?react';
import EyeSolidSvg from 'amicons/icons/round/solid/eye.svg?react';
import EyeSlashSolidSvg from 'amicons/icons/round/solid/eye-slash.svg?react';
import GridSolidSvg from 'amicons/icons/round/solid/grid-2x2.svg?react';
import SunSolidSvg from 'amicons/icons/round/solid/sun.svg?react';
import XCircleSolidSvg from 'amicons/icons/round/solid/x-circle.svg?react';

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

export const CheckCircleIcon = createIcon(CheckCircleSvg, CheckCircleSolidSvg);
export const EyeIcon = createIcon(EyeSvg, EyeSolidSvg);
export const EyeSlashIcon = createIcon(EyeSlashSvg, EyeSlashSolidSvg);
export const GridIcon = createIcon(GridSvg, GridSolidSvg);
export const MonitorIcon = createIcon(MonitorSvg, MonitorSolidSvg);
export const MoonIcon = createIcon(MoonSvg, MoonSolidSvg);
export const SunIcon = createIcon(SunSvg, SunSolidSvg);
export const XCircleIcon = createIcon(XCircleSvg, XCircleSolidSvg);
