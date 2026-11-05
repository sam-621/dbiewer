import { useTranslation } from 'react-i18next';
import { useReactFlow } from '@xyflow/react';

import { ExpandIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

const FIT_VIEW_DURATION = 200;

export const DiagramFitViewButton = () => {
  const { t } = useTranslation();
  const { fitView } = useReactFlow();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t('Fit view')}
            onClick={() => void fitView({ duration: FIT_VIEW_DURATION })}
          />
        }
      >
        <ExpandIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipPopup>{t('Fit view')}</TooltipPopup>
    </Tooltip>
  );
};
