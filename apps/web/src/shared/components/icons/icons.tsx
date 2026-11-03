import type { ComponentProps, ComponentType, FC } from 'react';
import ReloadSvg from 'amicons/icons/round/line/arrow-rotate-cw-up.svg?react';
import CheckCircleSvg from 'amicons/icons/round/line/check-circle.svg?react';
import ChevronDownSvg from 'amicons/icons/round/line/chevron-small-down.svg?react';
import ChevronRightSvg from 'amicons/icons/round/line/chevron-small-right.svg?react';
import CodeSvg from 'amicons/icons/round/line/code.svg?react';
import MoonSvg from 'amicons/icons/round/line/crescent.svg?react';
import MonitorSvg from 'amicons/icons/round/line/desktop.svg?react';
import EyeSvg from 'amicons/icons/round/line/eye.svg?react';
import EyeSlashSvg from 'amicons/icons/round/line/eye-slash.svg?react';
import FileSvg from 'amicons/icons/round/line/file.svg?react';
import GridSvg from 'amicons/icons/round/line/grid-2x2.svg?react';
import KeySvg from 'amicons/icons/round/line/key.svg?react';
import LinkSvg from 'amicons/icons/round/line/link.svg?react';
import MagnifyingGlassSvg from 'amicons/icons/round/line/magnifying-glass.svg?react';
import SunSvg from 'amicons/icons/round/line/sun.svg?react';
import TableSvg from 'amicons/icons/round/line/table.svg?react';
import XCircleSvg from 'amicons/icons/round/line/x-circle.svg?react';
import ReloadSolidSvg from 'amicons/icons/round/solid/arrow-rotate-cw-up.svg?react';
import CheckCircleSolidSvg from 'amicons/icons/round/solid/check-circle.svg?react';
import ChevronDownSolidSvg from 'amicons/icons/round/solid/chevron-small-down.svg?react';
import ChevronRightSolidSvg from 'amicons/icons/round/solid/chevron-small-right.svg?react';
import CodeSolidSvg from 'amicons/icons/round/solid/code.svg?react';
import MoonSolidSvg from 'amicons/icons/round/solid/crescent.svg?react';
import MonitorSolidSvg from 'amicons/icons/round/solid/desktop.svg?react';
import EyeSolidSvg from 'amicons/icons/round/solid/eye.svg?react';
import EyeSlashSolidSvg from 'amicons/icons/round/solid/eye-slash.svg?react';
import FileSolidSvg from 'amicons/icons/round/solid/file.svg?react';
import GridSolidSvg from 'amicons/icons/round/solid/grid-2x2.svg?react';
import KeySolidSvg from 'amicons/icons/round/solid/key.svg?react';
import LinkSolidSvg from 'amicons/icons/round/solid/link.svg?react';
import MagnifyingGlassSolidSvg from 'amicons/icons/round/solid/magnifying-glass.svg?react';
import SunSolidSvg from 'amicons/icons/round/solid/sun.svg?react';
import TableSolidSvg from 'amicons/icons/round/solid/table.svg?react';
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
export const ChevronDownIcon = createIcon(ChevronDownSvg, ChevronDownSolidSvg);
export const ChevronRightIcon = createIcon(ChevronRightSvg, ChevronRightSolidSvg);
export const CodeIcon = createIcon(CodeSvg, CodeSolidSvg);
export const EyeIcon = createIcon(EyeSvg, EyeSolidSvg);
export const EyeSlashIcon = createIcon(EyeSlashSvg, EyeSlashSolidSvg);
export const FileIcon = createIcon(FileSvg, FileSolidSvg);
export const GridIcon = createIcon(GridSvg, GridSolidSvg);
export const KeyIcon = createIcon(KeySvg, KeySolidSvg);
export const LinkIcon = createIcon(LinkSvg, LinkSolidSvg);
export const MagnifyingGlassIcon = createIcon(MagnifyingGlassSvg, MagnifyingGlassSolidSvg);
export const MonitorIcon = createIcon(MonitorSvg, MonitorSolidSvg);
export const MoonIcon = createIcon(MoonSvg, MoonSolidSvg);
export const ReloadIcon = createIcon(ReloadSvg, ReloadSolidSvg);
export const SunIcon = createIcon(SunSvg, SunSolidSvg);
export const TableIcon = createIcon(TableSvg, TableSolidSvg);
export const XCircleIcon = createIcon(XCircleSvg, XCircleSolidSvg);
