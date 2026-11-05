import { createContext } from 'react';

import { createDiagramViewStore } from '../utils/diagram-view-store.utils';

export const DiagramViewContext = createContext(createDiagramViewStore());
