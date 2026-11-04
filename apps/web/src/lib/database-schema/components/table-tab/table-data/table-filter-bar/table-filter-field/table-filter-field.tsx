import { type Icon, XIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';

import { useTableFilterHistory } from '../../../../../hooks/use-table-filter-history';
import { TableFilterHistory } from '../table-filter-history/table-filter-history';

import { useTableFilterEditor } from './use-table-filter-editor';

type Props = {
  icon: Icon;
  label: string;
  historyLabel: string;
  clearLabel: string;
  historyKey: string;
  value: string;
  columns: string[];
  onApply: (text: string) => void;
  onPin: () => void;
};

export const TableFilterField = ({
  icon,
  label,
  historyLabel,
  clearLabel,
  historyKey,
  value,
  columns,
  onApply,
  onPin
}: Props) => {
  const { history, addToHistory } = useTableFilterHistory(historyKey);

  const submit = (text: string) => {
    if (text) addToHistory(text);
    onApply(text);
  };

  const { containerRef, contentRef, hasText, writeText } = useTableFilterEditor({
    label,
    value,
    columns,
    onSubmit: submit,
    onEdit: onPin
  });

  const replaceAndApply = (text: string) => {
    writeText(text);
    onApply(text);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2">
      <TableFilterHistory
        icon={icon}
        label={historyLabel}
        items={history}
        finalFocus={contentRef}
        onSelect={replaceAndApply}
      />
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{label}</span>
      <div ref={containerRef} className="min-w-0 flex-1 cursor-text" />
      {hasText && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={clearLabel}
          className="shrink-0 text-muted-foreground"
          onClick={() => replaceAndApply('')}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
};
