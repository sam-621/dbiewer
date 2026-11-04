import { acceptCompletion, autocompletion, closeCompletion } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { PostgreSQL, sql, type SQLNamespace } from '@codemirror/lang-sql';
import { bracketMatching, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import {
  type Compartment,
  EditorState,
  type Extension,
  Prec,
  Transaction
} from '@codemirror/state';
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

import type { DbSchemaNode } from '@/lib/database-schema/utils/database-schema.utils';

import { quoteIdentifier } from './sql.utils';

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
  '.cm-lineNumbers .cm-gutterElement': { minWidth: 'calc(3ch + 20px)', paddingInline: '12px 8px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--accent)' },
  '.cm-activeLineGutter': { color: 'var(--foreground)' },
  '.cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground':
    { backgroundColor: 'color-mix(in srgb, var(--color-brand) 28%, transparent)' },
  '.cm-matchingBracket': { backgroundColor: 'var(--accent)', outline: '1px solid var(--ring)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px color-mix(in srgb, var(--foreground) 12%, transparent)',
    overflow: 'hidden'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    maxHeight: '16em',
    padding: '4px'
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '2px 8px',
    borderRadius: '4px',
    lineHeight: '1.6'
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)'
  },
  '.cm-completionIcon': { color: 'var(--muted-foreground)', opacity: '1' },
  '.cm-completionMatchedText': {
    textDecoration: 'none',
    color: 'var(--sql-kw)',
    fontWeight: '600'
  },
  '.cm-completionDetail': { color: 'var(--muted-foreground)', fontStyle: 'normal' }
});

const sqlFragmentTheme = EditorView.theme({
  '&': { height: 'auto', backgroundColor: 'transparent', fontSize: '12px' },
  '.cm-scroller': { scrollbarWidth: 'none' },
  '.cm-content': { paddingBlock: '6px' },
  '.cm-line': { padding: '0' }
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
  languageCompartment: Compartment;
  schema: SQLNamespace;
  onRun: () => void;
  onChange: (sql: string) => void;
};

export const getSqlLanguage = (schema: SQLNamespace) =>
  sql({ dialect: PostgreSQL, schema, defaultSchema: 'public' });

export const getSqlSchema = (schemas: DbSchemaNode[]): SQLNamespace =>
  Object.fromEntries(
    schemas.map(({ name, tables, views }) => [
      name,
      Object.fromEntries(
        [...tables, ...views].map(({ name, columns }) => [name, columns.map(({ name }) => name)])
      )
    ])
  );

const getSqlTextExtensions = (label: string): Extension[] => [
  drawSelection(),
  bracketMatching(),
  syntaxHighlighting(sqlHighlightStyle),
  sqlEditorTheme,
  EditorView.contentAttributes.of({ 'aria-label': label })
];

const getSqlBaseExtensions = (label: string): Extension[] => [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightActiveLine(),
  ...getSqlTextExtensions(label)
];

export const getSqlEditorExtensions = ({
  label,
  languageCompartment,
  schema,
  onRun,
  onChange
}: Params): Extension[] => [
  ...getSqlBaseExtensions(label),
  history(),
  languageCompartment.of(getSqlLanguage(schema)),
  autocompletion(),
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
  Prec.high(keymap.of([{ key: 'Tab', run: acceptCompletion }])),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  EditorView.updateListener.of(update => {
    if (update.docChanged) onChange(update.state.doc.toString());
  })
];

export const getSqlViewerExtensions = (label: string): Extension[] => [
  ...getSqlBaseExtensions(label),
  sql({ dialect: PostgreSQL }),
  keymap.of(defaultKeymap),
  EditorState.readOnly.of(true)
];

export const getSqlFragmentLanguage = (columns: string[]) =>
  sql({
    dialect: PostgreSQL,
    schema: columns.map(name => ({ label: name, apply: quoteIdentifier(name), type: 'property' }))
  });

const singleLine = EditorState.transactionFilter.of(transaction => {
  const { newDoc } = transaction;
  if (newDoc.lines === 1) return transaction;

  const changes = Array.from({ length: newDoc.lines - 1 }, (_, index) => {
    const { to } = newDoc.line(index + 1);
    return { from: to, to: to + 1, insert: ' ' };
  });

  return [transaction, { changes, sequential: true }];
});

type FragmentParams = {
  label: string;
  languageCompartment: Compartment;
  columns: string[];
  onSubmit: (text: string) => void;
  onChange: (text: string, isUserEdit: boolean) => void;
};

export const getSqlFragmentExtensions = ({
  label,
  languageCompartment,
  columns,
  onSubmit,
  onChange
}: FragmentParams): Extension[] => {
  const submit = (view: EditorView) => {
    closeCompletion(view);
    onSubmit(view.state.doc.toString().trim());
    return true;
  };

  return [
    sqlFragmentTheme,
    ...getSqlTextExtensions(label),
    singleLine,
    history(),
    languageCompartment.of(getSqlFragmentLanguage(columns)),
    autocompletion({ interactionDelay: 0 }),
    Prec.high(
      keymap.of([
        { key: 'Enter', run: submit, shift: submit },
        { key: 'Mod-Enter', run: submit },
        { key: 'Tab', run: acceptCompletion }
      ])
    ),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.updateListener.of(update => {
      if (!update.docChanged) return;

      const isUserEdit = update.transactions.some(
        transaction => transaction.docChanged && !transaction.annotation(Transaction.remote)
      );
      onChange(update.state.doc.toString(), isUserEdit);
    })
  ];
};

export const formatSql = (sqlText: string) =>
  format(sqlText, { language: 'postgresql', keywordCase: 'upper' });
