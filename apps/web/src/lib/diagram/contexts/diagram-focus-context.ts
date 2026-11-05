import { createContext } from 'react';

import type { DiagramFocus } from '../utils/diagram.utils';

export const DiagramFocusContext = createContext<DiagramFocus | null>(null);
