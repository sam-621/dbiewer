import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
import { useGetConnectionSchema } from '@/lib/database-schema/hooks/use-get-connection-schema';
import { FileNameDialog } from '@/lib/file/components/file-name-dialog/file-name-dialog';
import { useFileEditor } from '@/lib/file/hooks/use-file-editor';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

import { type RunQueryResult, useRunQuery } from '../../hooks/use-run-query';
import { getSqlSchema } from '../../utils/sql-editor.utils';

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
  file: CommonFileFragment | null;
};

export const SqlTab = ({ connectionId, connectionName, tabKey, file }: Props) => {
  const { t } = useTranslation();
  const { runQuery, isLoading } = useRunQuery();
  const [result, setResult] = useState<RunQueryResult | null>(null);
  const [resultsHeight, setResultsHeight] = useState(RESULTS_DEFAULT_HEIGHT);
  const { initialContent, isSaving, saveError, changeContent, save, nameDialog } = useFileEditor({
    connectionId,
    tabKey,
    type: 'sql',
    file
  });
  const tabRef = useRef<HTMLDivElement>(null);
  const { data: schemaData } = useGetConnectionSchema(connectionId);
  const sqlSchema = useMemo(
    () => getSqlSchema(schemaData?.connectionSchema.schemas ?? []),
    [schemaData]
  );

  const run = async () => {
    if (isLoading) return;

    const sql = getSqlToRun();
    if (!sql) return;

    setResult(await runQuery({ connectionId, sql }));
  };

  const { containerRef, getSqlToRun, formatEditorSql } = useSqlEditor({
    label: t('SQL editor'),
    initialSql: initialContent,
    schema: sqlSchema,
    onRun: () => void run(),
    onChange: changeContent
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
        isSaving={isSaving}
        onRun={() => void run()}
        onSave={save}
        onFormat={formatEditorSql}
      />
      {saveError && (
        <Alert variant="error" className="m-2 w-auto">
          <AlertDescription>{t(saveError)}</AlertDescription>
        </Alert>
      )}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
      <SqlTabResizer height={resultsHeight} onHeightChange={changeResultsHeight} />
      <div style={{ height: resultsHeight }} className="shrink-0">
        <SqlResults result={result} isRunning={isLoading} />
      </div>
      <FileNameDialog title={t('Save file')} {...nameDialog} />
    </div>
  );
};
