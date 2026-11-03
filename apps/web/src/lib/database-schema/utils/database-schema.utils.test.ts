import { describe, expect, test } from 'vitest';

import { type DbSchemaNode, filterSchemas, formatColumnType } from './database-schema.utils';

const createSchema = (name: string, tables: string[], functions: string[] = []): DbSchemaNode => ({
  name,
  tables: tables.map(table => ({ name: table, columns: [] })),
  views: [],
  functions: functions.map(fn => ({ name: fn, arguments: '', kind: 'FUNCTION' }))
});

describe('filterSchemas', () => {
  const schemas = [
    createSchema('public', ['users', 'orders'], ['refresh_user_stats']),
    createSchema('billing', ['invoices'])
  ];

  test('returns every schema without a search', () => {
    expect(filterSchemas(schemas, '  ')).toBe(schemas);
  });

  test('keeps the objects whose name matches in every schema, ignoring case', () => {
    const result = filterSchemas(schemas, 'USER');

    expect(result).toHaveLength(1);
    expect(result[0]?.tables.map(t => t.name)).toEqual(['users']);
    expect(result[0]?.functions.map(f => f.name)).toEqual(['refresh_user_stats']);
  });

  test('drops the schemas without matches', () => {
    expect(filterSchemas(schemas, 'invoice').map(s => s.name)).toEqual(['billing']);
    expect(filterSchemas(schemas, 'missing')).toEqual([]);
  });
});

describe('formatColumnType', () => {
  test.each([
    ['timestamp with time zone', 'timestamptz'],
    ['timestamp(3) without time zone', 'timestamp(3)'],
    ['time with time zone', 'timetz'],
    ['character varying(255)', 'varchar(255)'],
    ['character varying[]', 'varchar[]'],
    ['character(2)', 'char(2)'],
    ['double precision', 'float8'],
    ['boolean', 'bool'],
    ['uuid', 'uuid'],
    ['numeric(10,2)', 'numeric(10,2)']
  ])('formats %s as %s', (type, expected) => {
    expect(formatColumnType(type)).toBe(expected);
  });
});
