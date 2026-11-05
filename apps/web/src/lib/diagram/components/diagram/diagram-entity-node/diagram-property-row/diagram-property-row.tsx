import { type CSSProperties, memo, use } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position } from '@xyflow/react';

import { KeyIcon, LinkIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';

import { DIAGRAM_ROW_HEIGHT } from '../../../../constants/diagram-sizes';
import { DiagramNavigationContext } from '../../../../contexts/diagram-navigation-context';
import type { DiagramProperty } from '../../../../utils/diagram.utils';

const HANDLE_STYLE: CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  opacity: 0
};

const ROW_CLASS_NAME = 'relative flex items-center gap-2 px-2.5 font-mono text-xs';

type Props = { entityId: string; property: DiagramProperty };

export const DiagramPropertyRow = memo(({ entityId, property }: Props) => {
  const { t } = useTranslation();
  const { goToReferencedEntity } = use(DiagramNavigationContext);

  return (
    <li style={{ height: DIAGRAM_ROW_HEIGHT }} className={ROW_CLASS_NAME}>
      <Handle
        id={property.name}
        type="target"
        position={Position.Left}
        isConnectable={false}
        style={HANDLE_STYLE}
      />
      <span title={property.name} className="max-w-[60%] shrink-0 truncate">
        {property.name}
      </span>
      <span title={property.type} className="min-w-0 truncate text-muted-foreground">
        {property.type}
      </span>
      <span className="ms-auto flex shrink-0 items-center gap-1">
        {property.isPrimaryKey && (
          <KeyIcon
            role="img"
            aria-hidden={false}
            aria-label={t('Primary key')}
            className="size-3.5 text-pk"
          />
        )}
        {property.isForeignKey && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="nodrag size-5 sm:size-5"
            aria-label={t('Go to the table referenced by {{name}}', { name: property.name })}
            onClick={event => {
              event.stopPropagation();
              goToReferencedEntity(entityId, property.name);
            }}
          >
            <LinkIcon className="size-3.5 text-fk sm:size-3.5" />
          </Button>
        )}
        {property.isNullable && (
          <span role="img" aria-label={t('Nullable')} className="text-muted-foreground">
            ?
          </span>
        )}
      </span>
      {property.isForeignKey && (
        <Handle
          id={property.name}
          type="source"
          position={Position.Right}
          isConnectable={false}
          style={HANDLE_STYLE}
        />
      )}
    </li>
  );
});
