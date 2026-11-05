import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactFlowProvider } from '@xyflow/react';

import { Diagram } from '@/lib/diagram/components/diagram/diagram';
import { getDiagramSchemaModel, getDiagramSchemas } from '@/lib/diagram/utils/diagram.utils';
import { getDiagramLayout } from '@/lib/diagram/utils/diagram-layout.utils';
import { Empty, EmptyHeader, EmptyTitle } from '@/shared/components/ui/empty';
import { Skeleton } from '@/shared/components/ui/skeleton';

import type { DiagramNavigation } from '../../constants/diagram-navigation';
import { useDiagramPositions } from '../../hooks/use-diagram-positions';
import { useGetSchemaDiagram } from '../../hooks/use-get-schema-diagram';
import { TableTabMessage } from '../table-tab/table-tab-message/table-tab-message';

import { DiagramTabHeader } from './diagram-tab-header/diagram-tab-header';

const DEFAULT_SCHEMA = 'public';
const IS_FOCUS_ENABLED = false;

type Props = {
  connectionId: string;
  navigation: DiagramNavigation;
  onNavigationChange: (change: Partial<DiagramNavigation>) => void;
};

export const DiagramTab = ({ connectionId, navigation, onNavigationChange }: Props) => {
  const { t } = useTranslation();
  const { diagram, diagramError, isLoading, isFetching, refetch } =
    useGetSchemaDiagram(connectionId);
  const {
    positions: storedPositions,
    changePositions,
    resetPositions
  } = useDiagramPositions(connectionId);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const schemas = useMemo(() => (diagram ? getDiagramSchemas(diagram) : []), [diagram]);
  const defaultSchema = schemas.includes(DEFAULT_SCHEMA) ? DEFAULT_SCHEMA : (schemas[0] ?? null);
  const schema = navigation.schema ?? defaultSchema;
  const visibleDiagram = useMemo(
    () => (diagram ? getDiagramSchemaModel(diagram, schema) : null),
    [diagram, schema]
  );
  const autoPositions = useMemo(
    () => (visibleDiagram ? getDiagramLayout(visibleDiagram) : {}),
    [visibleDiagram]
  );
  const positions = useMemo(
    () => ({ ...autoPositions, ...storedPositions }),
    [autoPositions, storedPositions]
  );

  const hasEntities = !diagramError && Boolean(diagram?.entities.length);

  const changeSchema = (nextSchema: string) => {
    onNavigationChange({ schema: nextSchema, trail: [] });
    setCenterId(null);
  };

  const goToEntity = useCallback(
    (id: string) => {
      const entity = diagram?.entities.find(current => current.id === id);
      if (!entity) return;

      onNavigationChange({ schema: entity.schema });
      setCenterId(id);
    },
    [diagram, onNavigationChange]
  );

  const reload = () => {
    onNavigationChange({ trail: [] });
    void refetch();
  };

  const resetLayout = () => {
    resetPositions();
    setCenterId(null);
    onNavigationChange({ trail: [] });
    setLayoutVersion(version => version + 1);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div role="status" aria-label={t('Loading diagram')} className="flex flex-col gap-2 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-6" />
          ))}
        </div>
      );
    }

    if (diagramError || !visibleDiagram) {
      return <TableTabMessage error={diagramError} isRetrying={isFetching} onRetry={reload} />;
    }

    if (!hasEntities) {
      return (
        <Empty className="md:py-12">
          <EmptyHeader>
            <EmptyTitle>{t('This database has no tables')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <div className="min-h-0 flex-1">
        <Diagram
          key={`${layoutVersion}:${schema}`}
          entities={visibleDiagram.entities}
          relations={visibleDiagram.relations}
          fullModel={diagram ?? visibleDiagram}
          positions={positions}
          initialCenterId={centerId}
          trail={navigation.trail}
          onTrailChange={trail => onNavigationChange({ trail })}
          search={search}
          isFocusEnabled={IS_FOCUS_ENABLED}
          pinnedId={pinnedId}
          onPinnedIdChange={setPinnedId}
          onHiddenEntityRequest={goToEntity}
          onPositionChange={(id, position) =>
            changePositions({ ...storedPositions, [id]: position })
          }
        />
      </div>
    );
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-full min-h-0 flex-col">
        <DiagramTabHeader
          schemas={schemas}
          schema={schema}
          onSchemaChange={changeSchema}
          hasEntities={hasEntities}
          search={search}
          onSearchChange={setSearch}
          onResetLayout={resetLayout}
          isReloading={isFetching}
          onReload={reload}
        />
        {renderBody()}
      </div>
    </ReactFlowProvider>
  );
};
