import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowsUpDownIcon, FunnelIcon } from '@/shared/components/icons/icons';
import { Separator } from '@/shared/components/ui/separator';

import { useGetConnectionSchema } from '../../../../hooks/use-get-connection-schema';
import { getObjectColumnNames } from '../../../../utils/database-schema.utils';

import { TableFilterField } from './table-filter-field/table-filter-field';

type Props = {
  connectionId: string;
  object: { schema: string; name: string };
  where: string;
  orderBy: string;
  onWhereChange: (where: string) => void;
  onOrderByChange: (orderBy: string) => void;
  onPin: () => void;
};

export const TableFilterBar = ({
  connectionId,
  object: { schema, name },
  where,
  orderBy,
  onWhereChange,
  onOrderByChange,
  onPin
}: Props) => {
  const { t } = useTranslation();
  const { data } = useGetConnectionSchema(connectionId);
  const columns = useMemo(
    () => getObjectColumnNames(data?.connectionSchema.schemas ?? [], { schema, name }),
    [data, schema, name]
  );
  const historyKey = `dbiewer:table-history:${connectionId}:${schema}.${name}`;

  return (
    <div className="flex shrink-0 border-b">
      <TableFilterField
        icon={FunnelIcon}
        label={t('WHERE')}
        historyLabel={t('WHERE history')}
        clearLabel={t('Clear WHERE')}
        historyKey={`${historyKey}:where`}
        value={where}
        columns={columns}
        onApply={onWhereChange}
        onPin={onPin}
      />
      <Separator orientation="vertical" />
      <TableFilterField
        icon={ArrowsUpDownIcon}
        label={t('ORDER BY')}
        historyLabel={t('ORDER BY history')}
        clearLabel={t('Clear ORDER BY')}
        historyKey={`${historyKey}:order-by`}
        value={orderBy}
        columns={columns}
        onApply={onOrderByChange}
        onPin={onPin}
      />
    </div>
  );
};
