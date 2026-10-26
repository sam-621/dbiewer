import z from 'zod';

export const ReadConnectionSchemaSchema = z.string();

export const ReadTableStructureSchema = z.object({
  connectionId: z.string(),
  schema: z.string(),
  name: z.string()
});

const VALUELESS_OPERATORS = ['IS_NULL', 'IS_NOT_NULL'];

const FilterSchema = z
  .object({
    column: z.string(),
    operator: z.enum(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'CONTAINS', 'IS_NULL', 'IS_NOT_NULL']),
    value: z.string().nullish()
  })
  .refine(filter => VALUELESS_OPERATORS.includes(filter.operator) || filter.value != null, {
    message: 'Value is required for this operator',
    path: ['value']
  });

export const ReadTableRowsSchema = ReadTableStructureSchema.extend({
  filters: z
    .array(FilterSchema)
    .nullish()
    .transform(filters => filters ?? []),
  orderBy: z.object({ column: z.string(), direction: z.enum(['ASC', 'DESC']) }).nullish(),
  page: z.number().int().min(1)
});
