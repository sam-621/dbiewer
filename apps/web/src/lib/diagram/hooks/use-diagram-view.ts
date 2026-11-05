import { use, useSyncExternalStore } from 'react';

import { DiagramViewContext } from '../contexts/diagram-view-context';
import type { DiagramView } from '../utils/diagram-view-store.utils';

export const useDiagramView = <TValue>(selector: (view: DiagramView) => TValue) => {
  const store = use(DiagramViewContext);

  return useSyncExternalStore(store.subscribe, () => selector(store.getView()));
};
