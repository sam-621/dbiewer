import { createContext } from 'react';

type ActiveConnectionContextValue = {
  storedId: string | null;
  setActiveConnection: (connectionId: string) => void;
};

export const ActiveConnectionContext = createContext<ActiveConnectionContextValue | null>(null);
