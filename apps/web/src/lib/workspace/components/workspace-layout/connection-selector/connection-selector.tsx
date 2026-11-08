import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonConnectionFragment } from '@/lib/api/types';
import { NewConnectionDialog } from '@/lib/connection/components/new-connection-dialog/new-connection-dialog';
import { RemoveConnectionDialog } from '@/lib/connection/components/remove-connection-dialog/remove-connection-dialog';
import { BinIcon, ChevronDownIcon, PlusIcon } from '@/shared/components/icons/icons';
import { PostgresIcon } from '@/shared/components/icons/postgres-icon';
import { Button } from '@/shared/components/ui/button';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger
} from '@/shared/components/ui/menu';

import { useActiveConnection } from '../../../hooks/use-active-connection';

export const ConnectionSelector = () => {
  const { t } = useTranslation();
  const { activeConnection, connections, setActiveConnection } = useActiveConnection();
  const [isNewConnectionOpen, setIsNewConnectionOpen] = useState(false);
  const [removingConnection, setRemovingConnection] = useState<CommonConnectionFragment | null>(
    null
  );

  if (!activeConnection) return null;

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="ghost" size="sm" className="min-w-0" />}>
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
          <span className="truncate text-[13px]">{activeConnection.name}</span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </MenuTrigger>
        <MenuPopup align="start" className="max-w-72">
          <MenuRadioGroup
            value={activeConnection.id}
            onValueChange={(connectionId: string) => setActiveConnection(connectionId)}
          >
            {connections.map(connection => (
              <MenuRadioItem
                key={connection.id}
                value={connection.id}
                className="grid-cols-[1fr_.75rem] gap-6 pe-3 *:row-start-1 [&>span:last-child]:col-start-1 [&>span:last-child]:min-w-0 [&>span:not(:last-child)]:col-start-2 [&>span:not(:last-child)]:ms-0 [&>span:not(:last-child)]:justify-self-end"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PostgresIcon className="size-4 shrink-0" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px]">{connection.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {connection.host}
                    </span>
                  </span>
                </span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem
            className="text-[13px] sm:text-[13px]"
            onClick={() => setIsNewConnectionOpen(true)}
          >
            <PlusIcon />
            {t('New connection')}
          </MenuItem>
          <MenuItem
            variant="destructive"
            className="text-[13px] sm:text-[13px]"
            onClick={() => setRemovingConnection(activeConnection)}
          >
            <BinIcon />
            {t('Delete connection')}
          </MenuItem>
        </MenuPopup>
      </Menu>
      <NewConnectionDialog
        isOpen={isNewConnectionOpen}
        onOpenChange={setIsNewConnectionOpen}
        onCreated={setActiveConnection}
      />
      {removingConnection && (
        <RemoveConnectionDialog
          connection={removingConnection}
          onClose={() => setRemovingConnection(null)}
        />
      )}
    </>
  );
};
