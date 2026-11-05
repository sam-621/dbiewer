import { createContext } from 'react';

type DiagramTrail = {
  currentId: string;
  backName: string;
  goBack: () => void;
  clear: () => void;
};

export const DiagramTrailContext = createContext<DiagramTrail | null>(null);
