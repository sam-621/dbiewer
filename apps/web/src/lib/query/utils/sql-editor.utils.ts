import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { PostgreSQL, sql } from '@codemirror/lang-sql';
import { bracketMatching, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { type Extension, Prec } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { format } from 'sql-formatter';

const sqlEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
    fontSize: '13px'
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6' },
  '.cm-content': { caretColor: 'var(--foreground)', paddingBlock: '8px' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-gutters': {
    backgroundColor: 'var(--background)',
    color: 'var(--muted-foreground)',
    border: 'none'
  },
  '.cm-lineNumbers .cm-gutterElement': { paddingInline: '12px 8px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--accent)' },
  '.cm-activeLineGutter': { color: 'var(--foreground)' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground':
    { backgroundColor: 'color-mix(in srgb, var(--color-brand) 28%, transparent)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent)', outline: '1px solid var(--ring)' }
});

const sqlHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--sql-kw)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--sql-str)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--sql-num)' },
  { tag: tags.standard(tags.name), color: 'var(--sql-fn)' },
  { tag: tags.typeName, color: 'var(--sql-col)' },
  { tag: tags.special(tags.name), color: 'var(--sql-tbl)' },
  { tag: tags.comment, color: 'var(--muted-foreground)', fontStyle: 'italic' }
]);

type Params = {
  label: string;
  onRun: () => void;
  onChange: (sql: string) => void;
};

export const getSqlEditorExtensions = ({ label, onRun, onChange }: Params): Extension[] => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  drawSelection(),
  bracketMatching(),
  history(),
  sql({ dialect: PostgreSQL }),
  syntaxHighlighting(sqlHighlightStyle),
  sqlEditorTheme,
  Prec.highest(
    keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          onRun();
          return true;
        }
      }
    ])
  ),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  EditorView.contentAttributes.of({ 'aria-label': label }),
  EditorView.updateListener.of(update => {
    if (update.docChanged) onChange(update.state.doc.toString());
  })
];

export const formatSql = (sqlText: string) =>
  format(sqlText, { language: 'postgresql', keywordCase: 'upper' });
