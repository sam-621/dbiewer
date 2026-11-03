import {
  FILTER_OPERATOR_LABELS,
  formatFilterValue,
  type TableFilter
} from '../../../../utils/table-view.utils';

export const TableFilterLabel = ({ filter }: { filter: TableFilter }) => (
  <span className="font-mono text-xs">
    <span className="text-sql-col">{filter.column}</span>{' '}
    <span className="text-muted-foreground">{FILTER_OPERATOR_LABELS[filter.operator]}</span>
    {filter.value !== null && (
      <>
        {' '}
        <span className="text-sql-str">{formatFilterValue(filter.value)}</span>
      </>
    )}
  </span>
);
