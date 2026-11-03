import type { KeyboardEvent, PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH
} from '../../../hooks/use-sidebar-width';

const KEYBOARD_STEP = 16;

type Props = {
  width: number;
  onWidthChange: (width: number) => void;
};

export const WorkspaceSidebarResizer = ({ width, onWidthChange }: Props) => {
  const { t } = useTranslation();

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) =>
      onWidthChange(startWidth + moveEvent.clientX - startX);

    const handlePointerUp = () => {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') onWidthChange(width - KEYBOARD_STEP);
    if (event.key === 'ArrowRight') onWidthChange(width + KEYBOARD_STEP);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={t('Resize sidebar')}
      aria-valuenow={width}
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => onWidthChange(SIDEBAR_DEFAULT_WIDTH)}
      className="relative -ms-px w-px shrink-0 cursor-col-resize bg-border outline-none after:absolute after:inset-y-0 after:-inset-x-1.5 hover:bg-ring focus-visible:bg-ring"
    />
  );
};
