import { useTranslation } from 'react-i18next';

import type { CommonConnectionFragment } from '@/lib/api/types';

import { NewConnectionDialog } from '../new-connection-dialog/new-connection-dialog';

import { ConnectionRow } from './connection-row/connection-row';

type Props = { connections: CommonConnectionFragment[] };

export const ConnectionsDevList = ({ connections }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">{t('Connections')}</h1>
        <NewConnectionDialog />
      </div>
      <ul className="flex flex-col divide-y rounded-xl border">
        {connections.map(connection => (
          <ConnectionRow key={connection.id} connection={connection} />
        ))}
      </ul>
    </div>
  );
};
