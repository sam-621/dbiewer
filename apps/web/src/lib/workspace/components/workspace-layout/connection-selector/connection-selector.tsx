import { ChevronDownIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger
} from '@/shared/components/ui/menu';

import { useActiveConnection } from '../../../hooks/use-active-connection';

export const ConnectionSelector = () => {
  const { activeConnection, connections, setActiveConnection } = useActiveConnection();

  if (!activeConnection) return null;

  return (
    <Menu>
      <MenuTrigger render={<Button variant="ghost" size="sm" className="min-w-0" />}>
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
        <span className="truncate">{activeConnection.name}</span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </MenuTrigger>
      <MenuPopup align="start" className="max-w-72">
        <MenuRadioGroup
          value={activeConnection.id}
          onValueChange={(connectionId: string) => setActiveConnection(connectionId)}
        >
          {connections.map(connection => (
            <MenuRadioItem key={connection.id} value={connection.id}>
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{connection.name}</span>
                <span className="truncate text-xs text-muted-foreground">{connection.host}</span>
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
};
