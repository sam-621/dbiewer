import type { ReactNode } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group';

type Option = { value: string; label: string; content: ReactNode };

type Props = {
  label: string;
  value?: string;
  options: Option[];
  onChange: (value: string) => void;
};

export const PreferenceRow = ({ label, value, options, onChange }: Props) => (
  <div className="flex items-center justify-between gap-4 py-1 ps-2.5 pe-1">
    <span className="text-[13px] font-medium text-foreground">{label}</span>
    <ToggleGroup
      aria-label={label}
      className="gap-1"
      value={value ? [value] : []}
      onValueChange={([next]) => {
        if (next) onChange(next);
      }}
    >
      {options.map(option => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="size-8 data-pressed:bg-accent data-pressed:text-foreground"
        >
          {option.content}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);
