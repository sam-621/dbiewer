import { useEffect, useRef } from 'react';
import type { SQLNamespace } from '@codemirror/lang-sql';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { Logger } from '@/shared/utils/logger';

import { getStatementAt } from '../../utils/sql.utils';
import { formatSql, getSqlEditorExtensions, getSqlLanguage } from '../../utils/sql-editor.utils';

type Params = {
  label: string;
  initialSql: string;
  schema: SQLNamespace;
  onRun: () => void;
  onChange: (sql: string) => void;
};

export const useSqlEditor = ({ label, initialSql, schema, onRun, onChange }: Params) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const setupRef = useRef({ label, initialSql, schema });
  const languageCompartmentRef = useRef(new Compartment());
  const callbacksRef = useRef({ onRun, onChange });

  useEffect(() => {
    callbacksRef.current = { onRun, onChange };
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const { label, initialSql, schema } = setupRef.current;
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: initialSql,
        extensions: getSqlEditorExtensions({
          label,
          languageCompartment: languageCompartmentRef.current,
          schema,
          onRun: () => callbacksRef.current.onRun(),
          onChange: sql => callbacksRef.current.onChange(sql)
        })
      })
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartmentRef.current.reconfigure(getSqlLanguage(schema))
    });
  }, [schema]);

  const getSqlToRun = () => {
    const view = viewRef.current;
    if (!view) return '';

    const { from, to, head } = view.state.selection.main;
    const doc = view.state.doc.toString();

    return from === to ? getStatementAt(doc, head) : doc.slice(from, to).trim();
  };

  const formatEditorSql = () => {
    const view = viewRef.current;
    if (!view) return;

    try {
      const formatted = formatSql(view.state.doc.toString());
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: formatted } });
    } catch (error) {
      Logger.error(error);
    }
    view.focus();
  };

  return { containerRef, getSqlToRun, formatEditorSql };
};
