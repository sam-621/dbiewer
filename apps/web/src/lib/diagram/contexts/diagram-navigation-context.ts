import { createContext } from 'react';

import type { DiagramModel } from '../utils/diagram.utils';

type DiagramNavigation = {
  fullModel: DiagramModel;
  goToReferencedEntity: (entityId: string, propertyName: string) => void;
  goToRelatedEntity: (entityId: string, relatedId: string) => void;
};

export const DiagramNavigationContext = createContext<DiagramNavigation>({
  fullModel: { entities: [], relations: [] },
  goToReferencedEntity: () => {},
  goToRelatedEntity: () => {}
});
