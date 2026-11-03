import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDraftSql } from '../../hooks/use-draft-sql';
import { type RunQueryResult, useRunQuery } from '../../hooks/use-run-query';

import { SqlResults } from './sql-results/sql-results';
import { SqlTabResizer } from './sql-tab-resizer/sql-tab-resizer';
import { SqlTabToolbar } from './sql-tab-toolbar/sql-tab-toolbar';
import { useSqlEditor } from './use-sql-editor';

const RESULTS_DEFAULT_HEIGHT = 280;
const PANEL_MIN_HEIGHT = 96;

type Props = {
  connectionId: string;
  connectionName: string;
  tabKey: string;
};

export const SqlTab = ({ connectionId, connectionName, tabKey }: Props) => {
  const { t } = useTranslation();
  const { runQuery, isLoading } = useRunQuery();
  const [result, setResult] = useState<RunQueryResult | null>(null);
  const [resultsHeight, setResultsHeight] = useState(RESULTS_DEFAULT_HEIGHT);
  const { initialSql, changeDraftSql } = useDraftSql(connectionId, tabKey);
  const tabRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    if (isLoading) return;

    const sql = getSqlToRun();
    if (!sql) return;

    setResult(await runQuery({ connectionId, sql }));
  };

  const { containerRef, getSqlToRun, formatEditorSql } = useSqlEditor({
    label: t('SQL editor'),
    initialSql,
    onRun: () => void run(),
    onChange: changeDraftSql
  });

  const changeResultsHeight = (height: number) => {
    const maxHeight = (tabRef.current?.clientHeight ?? height) - PANEL_MIN_HEIGHT;
    setResultsHeight(Math.round(Math.max(PANEL_MIN_HEIGHT, Math.min(maxHeight, height))));
  };

  return (
    <div ref={tabRef} className="flex h-full min-h-0 flex-col">
      <SqlTabToolbar
        connectionName={connectionName}
        isRunning={isLoading}
        onRun={() => void run()}
        onFormat={formatEditorSql}
      />
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
      <SqlTabResizer height={resultsHeight} onHeightChange={changeResultsHeight} />
      <div style={{ height: resultsHeight }} className="shrink-0">
        <SqlResults result={result} isRunning={isLoading} />
      </div>
    </div>
  );
};
