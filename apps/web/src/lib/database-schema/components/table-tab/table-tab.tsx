import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tabs, TabsPanel } from '@/shared/components/ui/tabs';

import { useGetTableRows } from '../../hooks/use-get-table-rows';
import { useGetTableStructure } from '../../hooks/use-get-table-structure';
import type { TableViewState } from '../../utils/table-view.utils';

import { TableData } from './table-data/table-data';
import { TableStructure } from './table-structure/table-structure';
import { TableTabHeader } from './table-tab-header/table-tab-header';
import { TableTabMessage } from './table-tab-message/table-tab-message';

export type TableTabObject = { kind: 'table' | 'view'; schema: string; name: string };

type Props = {
  connectionId: string;
  object: TableTabObject;
  state: TableViewState;
  onStateChange: (state: TableViewState) => void;
  onPin: () => void;
};

export const TableTab = ({ connectionId, object, state, onStateChange, onPin }: Props) => {
  const { t } = useTranslation();
  const input = { connectionId, schema: object.schema, name: object.name };
  const structureResult = useGetTableStructure(input);
  const rowsResult = useGetTableRows({
    ...input,
    filters: state.filters,
    orderBy: state.orderBy,
    page: state.page
  });
  const { structure, structureError } = structureResult;

  const reload = () => {
    void structureResult.refetch();
    void rowsResult.refetch();
  };

  const renderBody = () => {
    if (structureResult.isLoading) {
      return (
        <div role="status" aria-label={t('Loading table')} className="flex flex-col gap-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>
      );
    }

    if (structureError || !structure) {
      return (
        <TableTabMessage
          error={structureError}
          isRetrying={structureResult.isFetching}
          onRetry={() => structureResult.refetch()}
        />
      );
    }

    return (
      <>
        <TabsPanel value="data" className="flex min-h-0 flex-col">
          <TableData
            structure={structure}
            rowsResult={rowsResult}
            state={state}
            onStateChange={onStateChange}
            objectName={object.name}
            onPin={onPin}
          />
        </TabsPanel>
        <TabsPanel value="structure" className="min-h-0 overflow-auto">
          <TableStructure kind={object.kind} structure={structure} />
        </TabsPanel>
      </>
    );
  };

  return (
    <Tabs
      value={state.view}
      onValueChange={(view: TableViewState['view']) => onStateChange({ ...state, view })}
      className="h-full min-h-0 gap-0"
    >
      <TableTabHeader
        connectionId={connectionId}
        object={object}
        totalRows={rowsResult.tableRows?.totalRows ?? null}
        totalColumns={structure?.columns.length ?? null}
        isReloading={structureResult.isFetching || rowsResult.isFetching}
        onReload={reload}
      />
      {renderBody()}
    </Tabs>
  );
};
