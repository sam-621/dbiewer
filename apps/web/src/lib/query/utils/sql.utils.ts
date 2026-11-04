const RESERVED_WORDS = new Set(
  (
    'all analyse analyze and any array as asc asymmetric authorization binary both case cast check ' +
    'collate collation column concurrently constraint create cross current_catalog current_date ' +
    'current_role current_schema current_time current_timestamp current_user default deferrable ' +
    'desc distinct do else end except false fetch for foreign freeze from full grant group having ' +
    'ilike in initially inner intersect into is isnull join lateral leading left like limit ' +
    'localtime localtimestamp natural not notnull null offset on only or order outer overlaps ' +
    'placing primary references returning right select session_user similar some symmetric ' +
    'system_user table tablesample then to trailing true union unique user using variadic verbose ' +
    'when where window with'
  ).split(' ')
);

const PLAIN_IDENTIFIER = /^[a-z_][a-z0-9_$]*$/;

export const quoteIdentifier = (name: string) =>
  PLAIN_IDENTIFIER.test(name) && !RESERVED_WORDS.has(name)
    ? name
    : `"${name.replaceAll('"', '""')}"`;

type Segment = { from: number; to: number };

const DOLLAR_TAG = /^\$[A-Za-z_]?\w*\$/;

const getStatementSegments = (sql: string): Segment[] => {
  const segments: Segment[] = [];
  let from = 0;
  let index = 0;

  const skipUntil = (closing: string, start: number) => {
    const end = sql.indexOf(closing, start);
    return end === -1 ? sql.length : end + closing.length;
  };

  while (index < sql.length) {
    const char = sql[index];
    const next = sql[index + 1];

    if (char === "'" || char === '"') {
      index += 1;
      while (index < sql.length) {
        if (sql[index] === char && sql[index + 1] === char) index += 2;
        else if (sql[index] === char) break;
        else index += 1;
      }
      index += 1;
    } else if (char === '-' && next === '-') {
      index = skipUntil('\n', index);
    } else if (char === '/' && next === '*') {
      index = skipUntil('*/', index + 2);
    } else if (char === '$' && DOLLAR_TAG.test(sql.slice(index))) {
      const [tag = ''] = DOLLAR_TAG.exec(sql.slice(index)) ?? [];
      index = skipUntil(tag, index + tag.length);
    } else if (char === ';') {
      segments.push({ from, to: index });
      index += 1;
      from = index;
    } else {
      index += 1;
    }
  }

  segments.push({ from, to: sql.length });
  return segments;
};

const getSegmentText = (sql: string, { from, to }: Segment) => sql.slice(from, to).trim();

export const getStatementAt = (sql: string, cursor: number) => {
  const segments = getStatementSegments(sql);
  const index = segments.findIndex(segment => cursor <= segment.to);
  const current = segments[index];
  if (!current) return '';

  const previous = segments[index - 1];
  const beforeCursor = sql.slice(current.from, cursor);
  const isRightAfterPrevious = !beforeCursor.trim() && !beforeCursor.includes('\n');

  if (previous && (isRightAfterPrevious || !getSegmentText(sql, current))) {
    return getSegmentText(sql, previous);
  }

  return getSegmentText(sql, current);
};
