import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field';
import { Form } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select';

import {
  FILTER_OPERATOR_LABELS,
  isValuelessOperator,
  TABLE_FILTER_OPERATORS,
  type TableColumnNode,
  type TableFilter
} from '../../../../utils/table-view.utils';

import { useTableFilterForm } from './use-table-filter-form';

type Props = {
  columns: Pick<TableColumnNode, 'name'>[];
  filter?: TableFilter;
  onApply: (filter: TableFilter) => void;
};

export const TableFilterForm = ({ columns, filter, onApply }: Props) => {
  const { t } = useTranslation();
  const { form, onSubmit } = useTableFilterForm({
    defaultColumn: columns[0]?.name ?? '',
    filter,
    onApply
  });
  const {
    register,
    control,
    formState: { errors }
  } = form;
  const operator = useWatch({ control, name: 'operator' });

  const columnItems = columns.map(column => ({ value: column.name, label: column.name }));
  const operatorItems = TABLE_FILTER_OPERATORS.map(value => ({
    value,
    label: FILTER_OPERATOR_LABELS[value]
  }));

  return (
    <Form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <Controller
        control={control}
        name="column"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t('Column')}</FieldLabel>
            <Select items={columnItems} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger size="sm" className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {columnItems.map(item => (
                  <SelectItem key={item.value} value={item.value} className="font-mono">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="operator"
        render={({ field }) => (
          <Field>
            <FieldLabel>{t('Operator')}</FieldLabel>
            <Select items={operatorItems} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger size="sm" className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {operatorItems.map(item => (
                  <SelectItem key={item.value} value={item.value} className="font-mono">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
        )}
      />
      {!isValuelessOperator(operator) && (
        <Field invalid={!!errors.value}>
          <FieldLabel>{t('Value')}</FieldLabel>
          <Input
            size="sm"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            {...register('value')}
          />
          <FieldError match={!!errors.value}>
            {errors.value?.message && t(errors.value.message)}
          </FieldError>
        </Field>
      )}
      <Button type="submit" size="sm" className="self-end">
        {t('Apply')}
      </Button>
    </Form>
  );
};
