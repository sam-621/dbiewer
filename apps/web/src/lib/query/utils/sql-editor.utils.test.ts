import { Compartment, EditorState } from '@codemirror/state';
import { describe, expect, test, vi } from 'vitest';

import type { DbSchemaNode } from '@/lib/database-schema/utils/database-schema.utils';

import { getSqlFragmentExtensions, getSqlSchema } from './sql-editor.utils';

const column = (name: string) => ({ name, type: 'text', isPrimaryKey: false, isForeignKey: false });

describe('getSqlSchema', () => {
  test('maps each schema to its tables and views with their column names', () => {
    const schemas: DbSchemaNode[] = [
      {
        name: 'public',
        tables: [{ name: 'users', columns: [column('id'), column('email')] }],
        views: [{ name: 'active_users', columns: [column('id')] }],
        functions: [{ name: 'refresh', arguments: '', kind: 'FUNCTION' }]
      },
      { name: 'billing', tables: [{ name: 'invoices', columns: [] }], views: [], functions: [] }
    ];

    expect(getSqlSchema(schemas)).toEqual({
      public: { users: ['id', 'email'], active_users: ['id'] },
      billing: { invoices: [] }
    });
  });

  test('keeps the schemas without objects', () => {
    expect(getSqlSchema([{ name: 'empty', tables: [], views: [], functions: [] }])).toEqual({
      empty: {}
    });
  });

  test('returns an empty schema without data', () => {
    expect(getSqlSchema([])).toEqual({});
  });
});

describe('getSqlFragmentExtensions', () => {
  const createState = (doc: string) =>
    EditorState.create({
      doc,
      extensions: getSqlFragmentExtensions({
        label: 'WHERE',
        languageCompartment: new Compartment(),
        columns: [],
        onSubmit: vi.fn(),
        onChange: vi.fn()
      })
    });

  test('replaces the line breaks with spaces', () => {
    const state = createState('a = 1').update({
      changes: { from: 5, insert: '\nand\nb = 2' }
    }).state;

    expect(state.doc.toString()).toBe('a = 1 and b = 2');
    expect(state.doc.lines).toBe(1);
  });
});
