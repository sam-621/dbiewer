import { useTranslation } from 'react-i18next';

import { KeyIcon, LinkIcon } from '@/shared/components/icons/icons';

import { type DbSchemaNode, formatColumnType } from '../../../utils/database-schema.utils';
import { ExplorerName } from '../explorer-name/explorer-name';

type Props = { columns: DbSchemaNode['tables'][number]['columns'] };

export const ExplorerColumns = ({ columns }: Props) => {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col py-0.5 ps-5">
      {columns.map(column => (
        <li key={column.name} className="flex h-6 items-center gap-1.5 px-2 text-xs">
          <span className="flex w-3.5 shrink-0 items-center">
            {column.isPrimaryKey && (
              <KeyIcon
                role="img"
                aria-hidden={false}
                aria-label={t('Primary key')}
                className="size-3.5 text-pk"
              />
            )}
            {!column.isPrimaryKey && column.isForeignKey && (
              <LinkIcon
                role="img"
                aria-hidden={false}
                aria-label={t('Foreign key')}
                className="size-3.5 text-fk"
              />
            )}
          </span>
          <ExplorerName
            name={column.name}
            className="max-w-[70%] shrink-0"
            isRowHighlighted={false}
          />
          <span title={column.type} className="ms-auto min-w-0 truncate ps-2 text-muted-foreground">
            {formatColumnType(column.type)}
          </span>
        </li>
      ))}
    </ul>
  );
};
