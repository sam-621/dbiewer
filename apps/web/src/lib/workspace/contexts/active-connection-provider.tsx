import { type ReactNode, useState } from 'react';

import { Logger } from '@/shared/utils/logger';

import { ActiveConnectionContext } from './active-connection-context';

const ACTIVE_CONNECTION_STORAGE_KEY = 'dbiewer:active-connection';

export const ActiveConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [storedId, setStoredId] = useState(getStoredActiveConnectionId);

  const setActiveConnection = (connectionId: string) => {
    storeActiveConnectionId(connectionId);
    setStoredId(connectionId);
  };

  return (
    <ActiveConnectionContext value={{ storedId, setActiveConnection }}>
      {children}
    </ActiveConnectionContext>
  );
};

const getStoredActiveConnectionId = () => {
  try {
    return localStorage.getItem(ACTIVE_CONNECTION_STORAGE_KEY);
  } catch (error) {
    Logger.error(error);
    return null;
  }
};

const storeActiveConnectionId = (connectionId: string) => {
  try {
    localStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, connectionId);
  } catch (error) {
    Logger.error(error);
  }
};
