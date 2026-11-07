import { describe, expect, test } from 'vitest';

import {
  formatTableOrder,
  getPrimaryKeyColumns,
  getTableRowKey,
  getVisibleTableRows,
  parseTableOrder,
  TableViewStateSchema
} from './table-view.utils';

describe('parseTableOrder', () => {
  test('reads a column with or without direction', () => {
    expect(parseTableOrder('email')).toEqual({ column: 'email', direction: 'ASC' });
    expect(parseTableOrder('email asc')).toEqual({ column: 'email', direction: 'ASC' });
    expect(parseTableOrder(' Email DESC ')).toEqual({ column: 'email', direction: 'DESC' });
  });

  test('reads a quoted column', () => {
    expect(parseTableOrder('"Full ""Name""" desc')).toEqual({
      column: 'Full "Name"',
      direction: 'DESC'
    });
  });

  test('returns null when it is not a single column', () => {
    expect(parseTableOrder('email desc, name')).toBeNull();
    expect(parseTableOrder('lower(email)')).toBeNull();
    expect(parseTableOrder('email desc nulls last')).toBeNull();
    expect(parseTableOrder('')).toBeNull();
  });
});

describe('formatTableOrder', () => {
  test('writes the column with quotes only when it needs them', () => {
    expect(formatTableOrder({ column: 'email', direction: 'ASC' })).toBe('email asc');
    expect(formatTableOrder({ column: 'order', direction: 'DESC' })).toBe('"order" desc');
  });
});

describe('TableViewStateSchema', () => {
  test('reads a state stored with the old filters', () => {
    const state = TableViewStateSchema.parse({
      view: 'structure',
      filters: [{ column: 'id', operator: 'EQ', value: '1' }],
      orderBy: { column: 'id', direction: 'ASC' },
      page: 2
    });

    expect(state).toEqual({ view: 'structure', where: '', orderBy: '', page: 2 });
  });
});

describe('getVisibleTableRows', () => {
  const tableRows = {
    columns: [
      { name: 'id', type: 'uuid' },
      { name: 'email', type: 'text' },
      { name: 'plan', type: 'text' }
    ],
    rows: [
      ['1', 'ana@acme.dev', null],
      ['2', 'bo@acme.dev', 'pro']
    ]
  };

  test('removes the hidden columns and their cells', () => {
    expect(getVisibleTableRows(tableRows, ['email'])).toEqual({
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'plan', type: 'text' }
      ],
      rows: [
        ['1', null],
        ['2', 'pro']
      ]
    });
  });

  test('ignores a hidden column that no longer exists', () => {
    expect(getVisibleTableRows(tableRows, ['deleted'])).toEqual(tableRows);
  });
});

describe('getTableRowKey', () => {
  const columns = [
    { name: 'tenant_id', type: 'int4' },
    { name: 'email', type: 'text' },
    { name: 'id', type: 'int4' }
  ];

  test('takes every primary key column in the order of the structure', () => {
    const primaryKeys = getPrimaryKeyColumns([
      { name: 'id', isPrimaryKey: true },
      { name: 'email', isPrimaryKey: false },
      { name: 'tenant_id', isPrimaryKey: true }
    ]);

    expect(getTableRowKey(columns, ['7', 'ana@acme.dev', '1'], primaryKeys)).toEqual([
      { column: 'id', value: '1' },
      { column: 'tenant_id', value: '7' }
    ]);
  });

  test('keeps NULL values', () => {
    expect(getTableRowKey(columns, [null, 'ana@acme.dev', '1'], ['tenant_id'])).toEqual([
      { column: 'tenant_id', value: null }
    ]);
  });
});
