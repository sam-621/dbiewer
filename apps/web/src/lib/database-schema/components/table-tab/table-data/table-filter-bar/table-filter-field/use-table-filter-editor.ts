import { useEffect, useRef, useState } from 'react';
import { Compartment, EditorState, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import {
  getSqlFragmentExtensions,
  getSqlFragmentLanguage
} from '@/lib/query/utils/sql-editor.utils';

type Params = {
  label: string;
  value: string;
  columns: string[];
  onSubmit: (text: string) => void;
  onEdit: () => void;
};

export const useTableFilterEditor = ({ label, value, columns, onSubmit, onEdit }: Params) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const setupRef = useRef({ label, value, columns });
  const languageCompartmentRef = useRef(new Compartment());
  const callbacksRef = useRef({ onSubmit, onEdit });
  const [hasText, setHasText] = useState(Boolean(value));

  useEffect(() => {
    callbacksRef.current = { onSubmit, onEdit };
  });

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const { label, value, columns } = setupRef.current;
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: value,
        extensions: getSqlFragmentExtensions({
          label,
          languageCompartment: languageCompartmentRef.current,
          columns,
          onSubmit: text => callbacksRef.current.onSubmit(text),
          onChange: (text, isUserEdit) => {
            setHasText(Boolean(text.trim()));
            if (isUserEdit) callbacksRef.current.onEdit();
          }
        })
      })
    });
    viewRef.current = view;
    contentRef.current = view.contentDOM;

    return () => {
      view.destroy();
      viewRef.current = null;
      contentRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartmentRef.current.reconfigure(getSqlFragmentLanguage(columns))
    });
  }, [columns]);

  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString().trim() !== value) replaceText(view, value);
  }, [value]);

  const writeText = (text: string) => {
    const view = viewRef.current;
    if (!view) return;

    replaceText(view, text);
    view.focus();
  };

  return { containerRef, contentRef, hasText, writeText };
};

const replaceText = (view: EditorView, text: string) =>
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text },
    selection: { anchor: text.length },
    annotations: Transaction.remote.of(true)
  });
