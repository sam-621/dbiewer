import { useEffect } from 'react';

const preventPinchZoom = (event: WheelEvent) => {
  if (event.ctrlKey) event.preventDefault();
};

export const usePreventPageZoom = () => {
  useEffect(() => {
    document.addEventListener('wheel', preventPinchZoom, { passive: false });

    return () => document.removeEventListener('wheel', preventPinchZoom);
  }, []);
};
