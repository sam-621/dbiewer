import type { KeyboardEvent, PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

const KEYBOARD_STEP = 16;

type Props = {
  height: number;
  onHeightChange: (height: number) => void;
};

export const SqlTabResizer = ({ height, onHeightChange }: Props) => {
  const { t } = useTranslation();

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = height;

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) =>
      onHeightChange(startHeight - (moveEvent.clientY - startY));

    const handlePointerUp = () => {
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') onHeightChange(height + KEYBOARD_STEP);
    if (event.key === 'ArrowDown') onHeightChange(height - KEYBOARD_STEP);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation="horizontal"
      aria-label={t('Resize results')}
      aria-valuenow={height}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className="relative h-px shrink-0 cursor-row-resize bg-border outline-none after:absolute after:inset-x-0 after:-inset-y-1.5 hover:bg-ring focus-visible:bg-ring"
    />
  );
};
