import { memo, use } from 'react';
import type { NodeProps } from '@xyflow/react';

import { cn } from '@/shared/utils/cn';

import { DIAGRAM_HEADER_HEIGHT } from '../../../constants/diagram-sizes';
import { DiagramFocusContext } from '../../../contexts/diagram-focus-context';
import { DiagramSearchContext } from '../../../contexts/diagram-search-context';
import { useDiagramView } from '../../../hooks/use-diagram-view';
import type { DiagramEntityNode as DiagramEntityFlowNode } from '../../../utils/diagram.utils';

import { DiagramHighlight } from './diagram-highlight/diagram-highlight';
import { DiagramPropertyRow } from './diagram-property-row/diagram-property-row';
import { DiagramRelatedMenu } from './diagram-related-menu/diagram-related-menu';
import { DiagramTrailPill } from './diagram-trail-pill/diagram-trail-pill';

export const DiagramEntityNode = memo(
  ({ id, data: { entity } }: NodeProps<DiagramEntityFlowNode>) => {
    const focus = use(DiagramFocusContext);
    const { matchedIds } = use(DiagramSearchContext);
    const isJumped = useDiagramView(view => view.jumpedId === id);
    const isDimmed =
      !isJumped &&
      ((Boolean(focus) && !focus?.entityIds.has(id)) ||
        (Boolean(matchedIds) && !matchedIds?.has(id)));

    return (
      <div className="relative size-full">
        <DiagramTrailPill entityId={id} />
        <article
          aria-label={entity.name}
          data-dimmed={isDimmed || undefined}
          data-jumped={isJumped || undefined}
          className={cn(
            'flex size-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground ring-ring/24 transition-[opacity,box-shadow,border-color] duration-[150ms,500ms,500ms] data-dimmed:opacity-25 data-jumped:border-ring data-jumped:ring-[3px]',
            focus?.entityId === id && 'border-primary'
          )}
        >
          <div
            style={{ height: DIAGRAM_HEADER_HEIGHT }}
            className="flex shrink-0 items-center gap-1 border-b bg-muted ps-2.5 pe-1.5"
          >
            <h3
              title={entity.name}
              className="min-w-0 flex-1 truncate font-mono text-xs font-semibold"
            >
              <DiagramHighlight text={entity.name} />
            </h3>
            <DiagramRelatedMenu entityId={id} entityName={entity.name} />
          </div>
          <ul>
            {entity.properties.map(property => (
              <DiagramPropertyRow key={property.name} entityId={id} property={property} />
            ))}
          </ul>
        </article>
      </div>
    );
  }
);
