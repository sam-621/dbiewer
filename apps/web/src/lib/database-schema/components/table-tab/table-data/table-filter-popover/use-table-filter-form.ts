import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  isValuelessOperator,
  TABLE_FILTER_OPERATORS,
  type TableFilter
} from '../../../../utils/table-view.utils';

type Params = {
  defaultColumn: string;
  filter?: TableFilter;
  onApply: (filter: TableFilter) => void;
};

export const useTableFilterForm = ({ defaultColumn, filter, onApply }: Params) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      column: filter?.column ?? defaultColumn,
      operator: filter?.operator ?? 'EQ',
      value: filter?.value ?? ''
    }
  });

  const onSubmit = ({ column, operator, value }: FormValues) =>
    onApply({ column, operator, value: isValuelessOperator(operator) ? null : value });

  return { form, onSubmit: form.handleSubmit(onSubmit) };
};

const Schema = z
  .object({
    column: z.string().min(1, 'Choose a column'),
    operator: z.enum(TABLE_FILTER_OPERATORS),
    value: z.string()
  })
  .refine(({ operator, value }) => isValuelessOperator(operator) || value.length > 0, {
    message: 'Enter a value',
    path: ['value']
  });

type FormValues = z.infer<typeof Schema>;
