import { cn } from '@/shared/utils/cn';

type Props = { size?: 'default' | 'sm' };

export const Brand = ({ size = 'default' }: Props) => (
  <div className="flex items-center gap-2">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('size-6 shrink-0', size === 'sm' && 'size-5.5')}
    >
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <g
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.5 5V18.5H8.25A3.5 3.5 0 0 1 8.25 11.5H10.5" />
        <path d="M13.5 5V18.5H15.75A3.5 3.5 0 0 0 15.75 11.5H13.5" />
      </g>
    </svg>
    <span
      className={cn('text-sm font-semibold tracking-[-0.01em]', size === 'sm' && 'text-[13px]')}
    >
      dbiewer
    </span>
  </div>
);
