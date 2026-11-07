import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tabs, TabsPanel } from '@/shared/components/ui/tabs';

import { useGetTableRows } from '../../hooks/use-get-table-rows';
import { useGetTableStructure } from '../../hooks/use-get-table-structure';
import {
  type SaveTableChangesResult,
  useSaveTableChanges
} from '../../hooks/use-save-table-changes';
import {
  addTableNewRow,
  countTableChanges,
  EMPTY_TABLE_CHANGES,
  getSaveTableChanges,
  removeTableNewRows,
  removeTableRowEdits,
  type TableChanges
} from '../../utils/table-changes.utils';
import type { TableRowKey, TableViewState } from '../../utils/table-view.utils';

import { DiscardTableChangesDialog } from './discard-table-changes-dialog/discard-table-changes-dialog';
import { TableData } from './table-data/table-data';
import type { TableCellRef } from './table-data/table-grid/table-grid';
import { TableStructure } from './table-structure/table-structure';
import { TableTabHeader } from './table-tab-header/table-tab-header';
import { TableTabMessage } from './table-tab-message/table-tab-message';

export type TableTabObject = { kind: 'table' | 'view'; schema: string; name: string };

type Props = {
  connectionId: string;
  object: TableTabObject;
  state: TableViewState;
  onStateChange: (state: TableViewState) => void;
  hiddenColumns: string[];
  onHiddenColumnsChange: (hiddenColumns: string[]) => void;
  changes: TableChanges;
  onChangesChange: (changes: TableChanges) => void;
  onPin: () => void;
};

export const TableTab = ({
  connectionId,
  object,
  state,
  onStateChange,
  hiddenColumns,
  onHiddenColumnsChange,
  changes,
  onChangesChange,
  onPin
}: Props) => {
  const { t } = useTranslation();
  const input = { connectionId, schema: object.schema, name: object.name };
  const structureResult = useGetTableStructure(input);
  const rowsResult = useGetTableRows({
    ...input,
    where: state.where,
    orderBy: state.orderBy,
    page: state.page
  });
  const { structure, structureError } = structureResult;
  const [selectedRowKeys, setSelectedRowKeys] = useState<TableRowKey[]>([]);
  const [selectedNewRowIds, setSelectedNewRowIds] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<TableCellRef | null>(null);
  const [editingCell, setEditingCell] = useState<TableCellRef | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [saveError, setSaveError] = useState<Extract<
    SaveTableChangesResult,
    { isSuccess: false }
  > | null>(null);
  const { saveTableChanges, isLoading: isSaving } = useSaveTableChanges();
  const changesCount = countTableChanges(changes);

  const discardChanges = () => {
    onChangesChange(EMPTY_TABLE_CHANGES);
    setSelectedNewRowIds([]);
    setEditingCell(null);
    setSaveError(null);
  };

  const confirmDiscard = (action: () => void) => {
    if (!changesCount) return action();
    setPendingAction(() => action);
  };

  const changeState = (nextState: TableViewState) => {
    if (
      nextState.where === state.where &&
      nextState.orderBy === state.orderBy &&
      nextState.page === state.page
    ) {
      return onStateChange(nextState);
    }

    confirmDiscard(() => {
      setSelectedRowKeys([]);
      setSelectedCell(null);
      setEditingCell(null);
      onStateChange(nextState);
    });
  };

  const reload = () =>
    confirmDiscard(() => {
      void structureResult.refetch();
      void rowsResult.refetch();
    });

  const addRow = () => {
    const id = crypto.randomUUID();
    const columns = rowsResult.tableRows?.columns ?? structure?.columns ?? [];
    const firstColumn = columns.find(column => !hiddenColumns.includes(column.name));

    onChangesChange(addTableNewRow(changes, id));
    const cell = firstColumn ? { row: id, column: firstColumn.name } : null;
    setSelectedCell(cell);
    setEditingCell(cell);
  };

  const removeNewRows = () => {
    onChangesChange(removeTableNewRows(changes, selectedNewRowIds));
    setSelectedNewRowIds([]);
  };

  const removeDeletedRows = (keys: TableRowKey[]) => {
    onChangesChange(removeTableRowEdits(changes, keys));
    setSelectedRowKeys([]);
  };

  const save = async () => {
    const result = await saveTableChanges({ ...input, ...getSaveTableChanges(changes) });

    if (!result.isSuccess) return setSaveError(result);

    discardChanges();
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
          {saveError && (
            <Alert variant="error" className="m-2 w-auto">
              <AlertDescription>
                <p>{t(saveError.error)}</p>
                {saveError.errorCode === 'QUERY_FAILED' && saveError.detail && (
                  <p className="font-mono text-xs">{saveError.detail}</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          <TableData
            structure={structure}
            rowsResult={rowsResult}
            state={state}
            onStateChange={changeState}
            hiddenColumns={hiddenColumns}
            connectionId={connectionId}
            object={object}
            onPin={onPin}
            selectedRowKeys={selectedRowKeys}
            onSelectedRowKeysChange={setSelectedRowKeys}
            selectedNewRowIds={selectedNewRowIds}
            onSelectedNewRowIdsChange={setSelectedNewRowIds}
            changes={changes}
            onChangesChange={onChangesChange}
            selectedCell={selectedCell}
            onSelectedCellChange={setSelectedCell}
            editingCell={editingCell}
            onEditingCellChange={setEditingCell}
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
      onValueChange={(view: TableViewState['view']) => changeState({ ...state, view })}
      className="h-full min-h-0 gap-0"
    >
      <TableTabHeader
        connectionId={connectionId}
        object={object}
        view={state.view}
        totalRows={rowsResult.tableRows?.totalRows ?? null}
        columns={structure?.columns ?? null}
        hiddenColumns={hiddenColumns}
        onHiddenColumnsChange={onHiddenColumnsChange}
        isReloading={structureResult.isFetching || rowsResult.isFetching}
        onReload={reload}
        selectedRowKeys={selectedRowKeys}
        selectedNewRowsCount={selectedNewRowIds.length}
        onNewRowsRemove={removeNewRows}
        onRowsDeleted={removeDeletedRows}
        changesCount={changesCount}
        isSaving={isSaving}
        onSave={() => void save()}
        onUndo={discardChanges}
        onRowAdd={addRow}
      />
      {renderBody()}
      {pendingAction && (
        <DiscardTableChangesDialog
          count={changesCount}
          onCancel={() => setPendingAction(null)}
          onDiscard={() => {
            discardChanges();
            pendingAction();
            setPendingAction(null);
          }}
        />
      )}
    </Tabs>
  );
};
