import type { GetConnectionSchemaQuery } from '@/lib/api/types';

export type DbSchemaNode = NonNullable<
  GetConnectionSchemaQuery['connectionSchema']['schemas']
>[number];

export const hasObjects = ({ tables, views, functions }: DbSchemaNode) =>
  tables.length > 0 || views.length > 0 || functions.length > 0;

export const filterSchemas = (schemas: DbSchemaNode[], search: string) => {
  const query = search.trim().toLowerCase();
  if (!query) return schemas;

  const matches = ({ name }: { name: string }) => name.toLowerCase().includes(query);

  return schemas
    .map(schema => ({
      ...schema,
      tables: schema.tables.filter(matches),
      views: schema.views.filter(matches),
      functions: schema.functions.filter(matches)
    }))
    .filter(hasObjects);
};

export const getObjectColumnNames = (
  schemas: DbSchemaNode[],
  { schema, name }: { schema: string; name: string }
) => {
  const node = schemas.find(current => current.name === schema);
  const object = [...(node?.tables ?? []), ...(node?.views ?? [])].find(
    current => current.name === name
  );

  return object?.columns.map(column => column.name) ?? [];
};

const TYPE_ALIASES: [RegExp, string][] = [
  [/^character varying/, 'varchar'],
  [/^character/, 'char'],
  [/^bit varying/, 'varbit'],
  [/^timestamp(\(\d+\))? with time zone/, 'timestamptz$1'],
  [/^timestamp(\(\d+\))? without time zone/, 'timestamp$1'],
  [/^time(\(\d+\))? with time zone/, 'timetz$1'],
  [/^time(\(\d+\))? without time zone/, 'time$1'],
  [/^double precision/, 'float8'],
  [/^boolean/, 'bool']
];

export const formatColumnType = (type: string) => {
  const alias = TYPE_ALIASES.find(([pattern]) => pattern.test(type));
  return alias ? type.replace(alias[0], alias[1]) : type;
};
