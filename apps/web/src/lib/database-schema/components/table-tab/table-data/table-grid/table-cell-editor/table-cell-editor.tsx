import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/utils/cn';

type Props = {
  column: string;
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
  onDone: () => void;
  onMove: (direction: 1 | -1) => void;
};

export const TableCellEditor = ({ column, value, onChange, onDone, onMove }: Props) => {
  const { t } = useTranslation();
  const [initialValue] = useState(value);
  const [text, setText] = useState(value ?? '');

  return (
    <>
      <span
        aria-hidden
        className={cn(
          'invisible block max-w-80 truncate',
          (initialValue === null || initialValue === undefined) && 'italic'
        )}
      >
        {initialValue ?? (initialValue === null ? 'NULL' : 'DEFAULT')}
      </span>
      <span
        className="absolute inset-0 flex items-center"
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.key === 'Enter') onDone();
          if (event.key === 'Escape') {
            onChange(initialValue);
            onDone();
          }
          if (event.key === 'Tab') {
            event.preventDefault();
            onMove(event.shiftKey ? -1 : 1);
          }
        }}
      >
        <input
          ref={input => input?.focus()}
          aria-label={t('Edit {{column}}', { column })}
          value={text}
          placeholder={value === null ? 'NULL' : undefined}
          className="h-full w-full min-w-0 bg-transparent px-2.5 leading-none text-foreground outline-none placeholder:text-muted-foreground/70 placeholder:italic"
          onChange={event => {
            setText(event.target.value);
            onChange(event.target.value);
          }}
          onBlur={onDone}
        />
        <button
          type="button"
          className="me-1 shrink-0 cursor-pointer rounded-sm px-1 text-[0.625rem] text-muted-foreground italic hover:bg-accent hover:text-foreground"
          onMouseDown={event => event.preventDefault()}
          onClick={() => {
            onChange(null);
            onDone();
          }}
        >
          {t('Set NULL')}
        </button>
      </span>
    </>
  );
};
