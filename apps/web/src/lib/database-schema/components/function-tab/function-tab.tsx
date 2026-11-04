import { useTranslation } from 'react-i18next';

import { CopyButton } from '@/shared/components/copy-button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';

import { useGetFunctionDefinition } from '../../hooks/use-get-function-definition';
import { TableTabMessage } from '../table-tab/table-tab-message/table-tab-message';

import { FunctionDefinition } from './function-definition/function-definition';

export type FunctionTabObject = { schema: string; name: string; arguments: string };

type Props = {
  connectionId: string;
  object: FunctionTabObject;
};

export const FunctionTab = ({ connectionId, object }: Props) => {
  const { t } = useTranslation();
  const { definition, definitionError, isLoading, isFetching, refetch } = useGetFunctionDefinition({
    connectionId,
    schema: object.schema,
    name: object.name,
    arguments: object.arguments
  });

  const renderBody = () => {
    if (isLoading) {
      return (
        <div role="status" aria-label={t('Loading function')} className="flex flex-col gap-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>
      );
    }

    if (definitionError || definition === null) {
      return (
        <TableTabMessage
          error={definitionError}
          isRetrying={isFetching}
          onRetry={() => refetch()}
        />
      );
    }

    return <FunctionDefinition definition={definition} />;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b px-4 py-2">
        <Badge variant="warning">{t('Function · read only')}</Badge>
        {definition !== null && <CopyButton value={definition} label={t('Copy definition')} />}
      </header>
      {renderBody()}
    </div>
  );
};
