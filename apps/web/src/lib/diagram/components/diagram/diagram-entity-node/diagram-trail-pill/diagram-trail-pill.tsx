import { type MouseEvent, use } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowLeftIcon, XIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';

import { DiagramTrailContext } from '../../../../contexts/diagram-trail-context';

const withoutBubbling = (action: () => void) => (event: MouseEvent) => {
  event.stopPropagation();
  action();
};

export const DiagramTrailPill = ({ entityId }: { entityId: string }) => {
  const { t } = useTranslation();
  const trail = use(DiagramTrailContext);

  if (trail?.currentId !== entityId) return null;

  const label = t('Back to {{name}}', { name: trail.backName });

  return (
    <div className="nodrag absolute start-0 bottom-full mb-1.5 flex h-6 max-w-full items-center rounded-md border bg-popover text-popover-foreground">
      <Button
        variant="ghost"
        size="xs"
        className="h-full min-w-0 gap-1 px-1.5 text-xs font-normal sm:h-full sm:text-xs"
        aria-label={label}
        onClick={withoutBubbling(trail.goBack)}
      >
        <ArrowLeftIcon className="size-3 sm:size-3" />
        <span className="min-w-0 truncate">{label}</span>
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        className="size-5 shrink-0 text-muted-foreground sm:size-5"
        aria-label={t('Clear the route')}
        onClick={withoutBubbling(trail.clear)}
      >
        <XIcon className="size-3 sm:size-3" />
      </Button>
    </div>
  );
};
