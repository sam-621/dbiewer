import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { getSqlViewerExtensions } from '@/lib/query/utils/sql-editor.utils';

type Props = { definition: string };

export const FunctionDefinition = ({ definition }: Props) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const label = t('Function definition');

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const view = new EditorView({
      parent,
      state: EditorState.create({ doc: definition, extensions: getSqlViewerExtensions(label) })
    });

    return () => view.destroy();
  }, [definition, label]);

  return <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />;
};
