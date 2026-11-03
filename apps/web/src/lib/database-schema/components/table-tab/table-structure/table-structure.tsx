import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { CopyButton } from '@/shared/components/copy-button';
import { KeyIcon } from '@/shared/components/icons/icons';
import { Badge } from '@/shared/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table';

import { formatColumnType } from '../../../utils/database-schema.utils';
import type { TableStructureNode } from '../../../utils/table-view.utils';

type Props = {
  kind: 'table' | 'view';
  structure: TableStructureNode;
};

export const TableStructure = ({ kind, structure }: Props) => {
  const { t } = useTranslation();
  const { columns, indexes, foreignKeys, definition } = structure;
  const definitionLabel = kind === 'table' ? t('DDL') : t('Definition');

  return (
    <div className="flex flex-col gap-8 p-4">
      <StructureSection title={t('Columns')}>
        <Table className="font-mono text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead>{t('Type')}</TableHead>
              <TableHead>{t('Nullable')}</TableHead>
              <TableHead>{t('Default')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.map(column => (
              <TableRow key={column.name}>
                <TableCell>
                  <span className="flex items-center gap-1.5">
                    {column.name}
                    {column.isPrimaryKey && (
                      <KeyIcon
                        role="img"
                        aria-hidden={false}
                        aria-label={t('Primary key')}
                        className="size-3.5 text-pk"
                      />
                    )}
                  </span>
                </TableCell>
                <TableCell title={column.type} className="text-muted-foreground">
                  {formatColumnType(column.type)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {column.isNullable ? t('Yes') : t('No')}
                </TableCell>
                <TableCell className="text-muted-foreground">{column.default ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StructureSection>
      {kind === 'table' && (
        <StructureSection title={t('Indexes')}>
          {indexes.length ? (
            <Table className="font-mono text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Name')}</TableHead>
                  <TableHead>{t('Definition')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {indexes.map(index => (
                  <TableRow key={index.name}>
                    <TableCell>{index.name}</TableCell>
                    <TableCell
                      title={index.definition}
                      className="max-w-md truncate text-muted-foreground"
                    >
                      {index.definition}
                    </TableCell>
                    <TableCell className="w-px">
                      {index.isUnique && <Badge variant="outline">{t('Unique')}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t('No indexes')}</p>
          )}
        </StructureSection>
      )}
      {kind === 'table' && (
        <StructureSection title={t('Foreign keys')}>
          {foreignKeys.length ? (
            <Table className="font-mono text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Columns')}</TableHead>
                  <TableHead>{t('References')}</TableHead>
                  <TableHead>{t('On delete')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foreignKeys.map(foreignKey => {
                  const columnsLabel = foreignKey.columns.join(', ');
                  const reference = `${foreignKey.referencedSchema}.${foreignKey.referencedTable}(${foreignKey.referencedColumns.join(', ')})`;

                  return (
                    <TableRow key={`${columnsLabel}-${reference}`}>
                      <TableCell>{columnsLabel}</TableCell>
                      <TableCell className="text-muted-foreground">{reference}</TableCell>
                      <TableCell className="text-muted-foreground">{foreignKey.onDelete}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t('No foreign keys')}</p>
          )}
        </StructureSection>
      )}
      <StructureSection
        title={definitionLabel}
        action={
          <CopyButton
            value={definition}
            label={kind === 'table' ? t('Copy DDL') : t('Copy definition')}
          />
        }
      >
        <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
          {definition}
        </pre>
      </StructureSection>
    </div>
  );
};

type SectionProps = { title: string; action?: ReactNode; children: ReactNode };

const StructureSection = ({ title, action, children }: SectionProps) => (
  <section className="flex flex-col gap-2">
    <div className="flex h-6 items-center justify-between gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);
