import { useTranslation } from 'react-i18next';

import { CopyButton } from '@/shared/components/copy-button';
import { KeyIcon } from '@/shared/components/icons/icons';
import { Field, FieldLabel } from '@/shared/components/ui/field';
import { Input } from '@/shared/components/ui/input';
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle
} from '@/shared/components/ui/sheet';
import { Textarea } from '@/shared/components/ui/textarea';

import { formatColumnType } from '../../../../utils/database-schema.utils';
import { getTableRowKey, type TableRowsNode } from '../../../../utils/table-view.utils';

const LONG_VALUE_LENGTH = 80;

export type TableRowDetail = { number: number; values: (string | null)[] };

type Props = {
  objectName: string;
  columns: TableRowsNode['columns'];
  primaryKeys: string[];
  isOpen: boolean;
  row: TableRowDetail | null;
  onClose: () => void;
};

export const TableRowSheet = ({
  objectName,
  columns,
  primaryKeys,
  isOpen,
  row,
  onClose
}: Props) => {
  const { t } = useTranslation();
  const rowKey =
    row && primaryKeys.length ? getTableRowKey(columns, row.values, primaryKeys) : null;

  return (
    <Sheet
      open={isOpen && !!row}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <SheetPopup closeProps={{ 'aria-label': t('Close') }}>
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{objectName}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {rowKey
              ? rowKey.map(({ column, value }) => `${column} = ${value ?? 'NULL'}`).join(', ')
              : t('Row {{number, number}}', { number: row?.number ?? 0 })}
          </SheetDescription>
        </SheetHeader>
        <SheetPanel className="flex flex-col gap-4">
          {row &&
            columns.map((column, index) => {
              const value = row.values[index] ?? null;
              const isLong =
                value !== null && (value.includes('\n') || value.length > LONG_VALUE_LENGTH);
              const controlProps = {
                readOnly: true,
                value: value ?? '',
                placeholder: value === null ? 'NULL' : undefined,
                className: 'font-mono placeholder:text-muted-foreground placeholder:italic'
              };

              return (
                <Field key={column.name}>
                  <div className="flex w-full items-center gap-1.5">
                    <FieldLabel className="min-w-0 gap-1.5 font-mono">
                      {primaryKeys.includes(column.name) && (
                        <KeyIcon
                          role="img"
                          aria-hidden={false}
                          aria-label={t('Primary key')}
                          className="size-3.5 text-pk"
                        />
                      )}
                      <span className="truncate">{column.name}</span>
                      <span className="font-normal text-muted-foreground">
                        {formatColumnType(column.type)}
                      </span>
                    </FieldLabel>
                    {value !== null && (
                      <CopyButton
                        value={value}
                        label={t('Copy {{name}}', { name: column.name })}
                        className="ms-auto"
                      />
                    )}
                  </div>
                  {isLong ? <Textarea {...controlProps} /> : <Input {...controlProps} />}
                </Field>
              );
            })}
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
};
