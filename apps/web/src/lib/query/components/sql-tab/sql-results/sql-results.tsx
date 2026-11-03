import { useTranslation } from 'react-i18next';

import { TableGrid } from '@/lib/database-schema/components/table-tab/table-data/table-grid/table-grid';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Spinner } from '@/shared/components/ui/spinner';

import { QUERY_ROW_LIMIT } from '../../../constants/query-results';
import type { RunQueryResult } from '../../../hooks/use-run-query';
import { useRunShortcutLabel } from '../../../hooks/use-run-shortcut-label';

type Props = {
  result: RunQueryResult | null;
  isRunning: boolean;
};

export const SqlResults = ({ result, isRunning }: Props) => {
  const { t } = useTranslation();
  const runShortcutLabel = useRunShortcutLabel();
  const execution = result?.isSuccess ? result.execution : null;

  const renderBody = () => {
    if (isRunning) {
      return (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner aria-label={t('Running query')} className="size-4" />
          {t('Running query')}
        </div>
      );
    }

    if (!result) {
      return (
        <Empty className="md:py-8">
          <EmptyHeader>
            <EmptyDescription>
              {t('Run the query with {{shortcut}} to see results here', {
                shortcut: runShortcutLabel
              })}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    if (!result.isSuccess) {
      return (
        <Empty className="md:py-8">
          <EmptyHeader>
            <EmptyTitle className="text-base">{t(result.error)}</EmptyTitle>
            {result.errorCode === 'QUERY_FAILED' && result.detail && (
              <EmptyDescription className="font-mono text-xs whitespace-pre-wrap">
                {result.detail}
              </EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      );
    }

    if (!result.execution.rows.length) {
      return (
        <Empty className="md:py-8">
          <EmptyHeader>
            <EmptyTitle className="font-mono text-base">{result.execution.command}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <>
        {result.execution.isTruncated && (
          <Alert variant="warning" className="shrink-0 rounded-none border-x-0 border-t-0 py-2">
            <AlertDescription className="text-xs">
              {t('The result was truncated to the first {{limit, number}} rows.', {
                limit: QUERY_ROW_LIMIT
              })}
            </AlertDescription>
          </Alert>
        )}
        <TableGrid columns={result.execution.columns} rows={result.execution.rows} />
      </>
    );
  };

  return (
    <section aria-label={t('Results')} className="flex h-full min-h-0 flex-col">
      <header className="flex h-9 shrink-0 items-center gap-4 border-b px-4 text-xs">
        <h3 className="font-medium">{t('Results')}</h3>
        {execution && !isRunning && (
          <p className="ms-auto font-mono text-muted-foreground">
            {t('{{count, number}} rows · {{durationMs, number}} ms', {
              count: execution.rowCount,
              durationMs: execution.durationMs
            })}
          </p>
        )}
      </header>
      {renderBody()}
    </section>
  );
};
