import { useTranslation } from 'react-i18next';

import { ReloadIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/shared/components/ui/tooltip';

import { useGetConnectionSchema } from '../../hooks/use-get-connection-schema';

export const ExplorerReloadButton = ({ connectionId }: { connectionId: string }) => {
  const { t } = useTranslation();
  const { isFetching, refetch } = useGetConnectionSchema(connectionId);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Reload')}
            loading={isFetching}
            onClick={() => refetch()}
          />
        }
      >
        <ReloadIcon />
      </TooltipTrigger>
      <TooltipPopup>{t('Reload')}</TooltipPopup>
    </Tooltip>
  );
};
