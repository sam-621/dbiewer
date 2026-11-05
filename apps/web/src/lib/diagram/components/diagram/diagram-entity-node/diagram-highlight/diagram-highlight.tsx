import { use } from 'react';

import { DiagramSearchContext } from '../../../../contexts/diagram-search-context';
import { getHighlightParts } from '../../../../utils/diagram.utils';

export const DiagramHighlight = ({ text }: { text: string }) => {
  const { search } = use(DiagramSearchContext);

  return getHighlightParts(text, search).map(({ text: part, isMatch }, index) =>
    isMatch ? (
      <mark key={index} className="rounded-xs bg-primary text-primary-foreground">
        {part}
      </mark>
    ) : (
      part
    )
  );
};
