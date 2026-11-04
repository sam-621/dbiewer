import { describe, expect, test } from 'vitest';

import { filterFiles, formatFileAge, getFileName } from './file.utils';

const NOW = new Date('2026-11-03T12:00:00.000Z').getTime();

describe('getFileName', () => {
  test('adds the extension of the type', () => {
    expect(getFileName({ name: 'top_customers', type: 'SQL' })).toBe('top_customers.sql');
    expect(getFileName({ name: 'notes', type: 'TXT' })).toBe('notes.txt');
  });
});

describe('filterFiles', () => {
  const FILES = [
    { name: 'top_customers', type: 'SQL' },
    { name: 'notes', type: 'TXT' }
  ] as const;

  test('filters by name and extension without matching case', () => {
    expect(filterFiles([...FILES], ' TOP ')).toEqual([FILES[0]]);
    expect(filterFiles([...FILES], '.txt')).toEqual([FILES[1]]);
  });

  test('returns every file without a search', () => {
    expect(filterFiles([...FILES], '')).toEqual(FILES);
  });
});

describe('formatFileAge', () => {
  test('uses the largest unit that fits', () => {
    expect(formatFileAge('2026-11-01T11:00:00.000Z', 'en', NOW)).toBe('2d');
    expect(formatFileAge('2026-11-03T09:30:00.000Z', 'en', NOW)).toBe('2h');
  });

  test('shows at least one minute', () => {
    expect(formatFileAge('2026-11-03T11:59:50.000Z', 'en', NOW)).toBe('1m');
  });
});
