import { useState } from 'react';

export const useRunShortcutLabel = () => {
  const [label] = useState(() => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘↵' : 'Ctrl↵'));

  return label;
};
