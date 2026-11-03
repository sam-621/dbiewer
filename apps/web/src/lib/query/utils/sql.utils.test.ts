import { describe, expect, test } from 'vitest';

import { getStatementAt } from './sql.utils';

const at = (sqlWithCursor: string) => {
  const cursor = sqlWithCursor.indexOf('|');
  return getStatementAt(sqlWithCursor.replace('|', ''), cursor);
};

describe('getStatementAt', () => {
  test('returns the whole text when there is a single statement', () => {
    expect(at('select |1')).toBe('select 1');
    expect(at('  select 1;  |')).toBe('select 1');
  });

  test('returns the statement under the cursor', () => {
    const sql = 'select 1;\nselect |2;\nselect 3;';

    expect(at(sql)).toBe('select 2');
    expect(at('select |1;\nselect 2;')).toBe('select 1');
    expect(at('select 1;\nselect 2;\nselect |3')).toBe('select 3');
  });

  test('returns the previous statement when the cursor is right after its semicolon', () => {
    expect(at('select 1;|\nselect 2;')).toBe('select 1');
    expect(at('select 1;  |select 2;')).toBe('select 1');
  });

  test('returns the next statement when the cursor is on a new line after a semicolon', () => {
    expect(at('select 1;\n|\nselect 2;')).toBe('select 2');
  });

  test('returns the last statement when the cursor is in the empty text after it', () => {
    expect(at('select 1;\nselect 2;\n\n|')).toBe('select 2');
  });

  test('does not split on semicolons inside strings, identifiers, comments or dollar quotes', () => {
    expect(at("select 'a;b', 'it''s;' as |x;\nselect 2")).toBe("select 'a;b', 'it''s;' as x");
    expect(at('select "a;b" from |t; select 2')).toBe('select "a;b" from t');
    expect(at('select 1 -- no; split\n+ |1; select 2')).toBe('select 1 -- no; split\n+ 1');
    expect(at('select /* a; b */ |1; select 2')).toBe('select /* a; b */ 1');
    expect(at('do $body$ begin; |end $body$; select 2')).toBe('do $body$ begin; end $body$');
    expect(at('select $$a;b$$ |x; select 2')).toBe('select $$a;b$$ x');
  });

  test('returns an empty text when there is nothing to run', () => {
    expect(at('|')).toBe('');
    expect(at('  |  ')).toBe('');
  });
});
