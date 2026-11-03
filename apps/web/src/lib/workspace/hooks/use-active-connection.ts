import { use } from 'react';

import { useGetConnections } from '@/lib/connection/hooks/use-get-connections';

import { ActiveConnectionContext } from '../contexts/active-connection-context';

export const useActiveConnection = () => {
  const context = use(ActiveConnectionContext);
  if (!context) throw new Error('useActiveConnection must be used within ActiveConnectionProvider');

  const { connections } = useGetConnections();
  const { storedId, setActiveConnection } = context;

  const activeConnection = connections.find(c => c.id === storedId) ?? connections[0] ?? null;

  return { activeConnection, connections, setActiveConnection };
};
