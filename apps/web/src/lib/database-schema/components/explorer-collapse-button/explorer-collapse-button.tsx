import { useTranslation } from 'react-i18next';

import { CollapseAllIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

export const ExplorerCollapseButton = ({ onCollapse }: { onCollapse: () => void }) => {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t('Collapse all')}
            onClick={onCollapse}
          />
        }
      >
        <CollapseAllIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipPopup>{t('Collapse all')}</TooltipPopup>
    </Tooltip>
  );
};
