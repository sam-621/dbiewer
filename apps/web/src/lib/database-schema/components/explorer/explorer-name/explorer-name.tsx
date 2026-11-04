import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/shared/utils/cn';

type Props = {
  name: string;
  className?: string;
  isRowHighlighted?: boolean;
};

type OverlayPosition = {
  left: number;
  top: number;
  height: number;
};

export const ExplorerName = ({ name, className, isRowHighlighted = true }: Props) => {
  const nameRef = useRef<HTMLSpanElement>(null);
  const [overlay, setOverlay] = useState<OverlayPosition | null>(null);

  useEffect(() => {
    const nameElement = nameRef.current;
    const row = nameElement?.parentElement;
    if (!nameElement || !row) return;

    const show = () => {
      if (nameElement.scrollWidth <= nameElement.clientWidth) return;

      const { left } = nameElement.getBoundingClientRect();
      const { top, height } = row.getBoundingClientRect();
      setOverlay({ left, top, height });
    };
    const hide = () => setOverlay(null);

    row.addEventListener('mouseenter', show);
    row.addEventListener('mouseleave', hide);

    return () => {
      row.removeEventListener('mouseenter', show);
      row.removeEventListener('mouseleave', hide);
    };
  }, []);

  useEffect(() => {
    if (!overlay) return;

    const hide = () => setOverlay(null);
    window.addEventListener('scroll', hide, true);

    return () => window.removeEventListener('scroll', hide, true);
  }, [overlay]);

  return (
    <>
      <span ref={nameRef} className={cn('truncate', className)}>
        {name}
      </span>
      {overlay &&
        createPortal(
          <div
            aria-hidden="true"
            style={overlay}
            className={cn(
              'pointer-events-none fixed z-50 flex items-center rounded-e-lg bg-background pe-2 text-xs whitespace-pre',
              isRowHighlighted
                ? 'bg-linear-to-r from-sidebar-accent to-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground'
            )}
          >
            {name}
          </div>,
          document.body
        )}
    </>
  );
};
