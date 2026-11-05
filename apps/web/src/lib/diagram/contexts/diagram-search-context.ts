import { createContext } from 'react';

type DiagramSearch = { search: string; matchedIds: Set<string> | null };

export const DiagramSearchContext = createContext<DiagramSearch>({
  search: '',
  matchedIds: null
});
