import { useTranslation } from 'react-i18next';

import { DiagramIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

export const ExplorerDiagramButton = ({ onOpen }: { onOpen: () => void }) => {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t('Diagram')}
            onClick={onOpen}
          />
        }
      >
        <DiagramIcon className="size-3.5" />
      </TooltipTrigger>
      <TooltipPopup>{t('Diagram')}</TooltipPopup>
    </Tooltip>
  );
};
