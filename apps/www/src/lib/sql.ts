export interface SqlToken {
  text: string;
  class?: string;
}

interface HighlightOptions {
  tables?: string[];
  columns?: string[];
}

const KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'JOIN',
  'ON',
  'WHERE',
  'GROUP',
  'BY',
  'LIMIT',
  'AS',
  'AND',
  'NOT',
  'IN'
]);

const FUNCTIONS = new Set(['SUM', 'COUNT', 'MAX']);

const TOKEN_PATTERN = /(--[^\n]*)|('[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+|.)/g;

export function highlightSql(code: string, options: HighlightOptions = {}): SqlToken[] {
  const tables = new Set(options.tables);
  const columns = new Set(options.columns);

  return Array.from(code.matchAll(TOKEN_PATTERN), ([text, comment, str, num, word]) => {
    if (comment) return { text, class: 'text-fg-4 italic' };
    if (str) return { text, class: 'text-sql-str' };
    if (num) return { text, class: 'text-sql-num' };
    if (word && KEYWORDS.has(word)) return { text, class: 'text-sql-kw' };
    if (word && FUNCTIONS.has(word)) return { text, class: 'text-sql-fn' };
    if (word && tables.has(word)) return { text, class: 'text-sql-tbl' };
    if (word && columns.has(word)) return { text, class: 'text-sql-col' };
    return { text };
  });
}
