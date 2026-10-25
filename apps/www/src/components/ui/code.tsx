import type * as React from 'react';
import { cn } from '@/lib/utils';

export function Code({
  className,
  tone = 'primary',
  ...props
}: React.ComponentProps<'code'> & { tone?: 'primary' | 'foreground' }): React.ReactElement {
  return (
    <code
      className={cn(
        'inline-block rounded-[.25rem] bg-muted px-[5px] py-px font-mono text-[11.5px]',
        tone === 'primary' ? 'text-primary' : 'text-foreground',
        className
      )}
      data-slot="code"
      {...props}
    />
  );
}
