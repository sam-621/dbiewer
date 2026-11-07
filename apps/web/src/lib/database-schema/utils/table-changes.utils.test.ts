import { describe, expect, test } from 'vitest';

import {
  addTableNewRow,
  countTableChanges,
  editTableCell,
  editTableNewRowCell,
  EMPTY_TABLE_CHANGES,
  getSaveTableChanges,
  removeTableNewRows,
  removeTableRowEdits
} from './table-changes.utils';

const KEY = [{ column: 'id', value: '1' }];

const OTHER_KEY = [{ column: 'id', value: '2' }];

describe('editTableCell', () => {
  test('keeps the edited cells by row and drops a cell set back to its original value', () => {
    const edited = editTableCell(
      editTableCell(EMPTY_TABLE_CHANGES, { key: KEY, column: 'email', value: 'a', original: 'b' }),
      { key: KEY, column: 'plan', value: null, original: 'pro' }
    );
    expect(countTableChanges(edited)).toBe(2);

    const reverted = editTableCell(
      editTableCell(edited, { key: KEY, column: 'email', value: 'b', original: 'b' }),
      { key: KEY, column: 'plan', value: 'pro', original: 'pro' }
    );
    expect(reverted).toEqual(EMPTY_TABLE_CHANGES);
  });
});

describe('editTableNewRowCell', () => {
  test('leaves an empty cell out so it takes the default and keeps an explicit NULL', () => {
    const added = addTableNewRow(EMPTY_TABLE_CHANGES, 'new-1');
    const edited = editTableNewRowCell(
      editTableNewRowCell(added, { id: 'new-1', column: 'email', value: 'a' }),
      { id: 'new-1', column: 'plan', value: null }
    );

    expect(
      editTableNewRowCell(edited, { id: 'new-1', column: 'email', value: '' }).newRows
    ).toEqual([{ id: 'new-1', values: { plan: null } }]);
  });
});

describe('removeTableRowEdits and removeTableNewRows', () => {
  test('removes only the given rows', () => {
    const changes = addTableNewRow(
      editTableCell(
        editTableCell(EMPTY_TABLE_CHANGES, {
          key: KEY,
          column: 'email',
          value: 'a',
          original: 'b'
        }),
        { key: OTHER_KEY, column: 'email', value: 'c', original: 'd' }
      ),
      'new-1'
    );

    const removed = removeTableNewRows(removeTableRowEdits(changes, [KEY]), ['new-1']);

    expect(Object.values(removed.edits)).toEqual([{ key: OTHER_KEY, values: { email: 'c' } }]);
    expect(removed.newRows).toEqual([]);
  });
});

describe('getSaveTableChanges', () => {
  test('sends one update per edited row and one insert per new row', () => {
    const changes = editTableNewRowCell(
      addTableNewRow(
        editTableCell(EMPTY_TABLE_CHANGES, {
          key: KEY,
          column: 'email',
          value: 'a',
          original: 'b'
        }),
        'new-1'
      ),
      { id: 'new-1', column: 'plan', value: 'pro' }
    );

    expect(getSaveTableChanges(changes)).toEqual({
      updates: [{ key: KEY, values: [{ column: 'email', value: 'a' }] }],
      inserts: [{ values: [{ column: 'plan', value: 'pro' }] }]
    });
  });
});
