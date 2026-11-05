import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DiagramIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger
} from '@/shared/components/ui/menu';

import { DiagramNavigationContext } from '../../../../contexts/diagram-navigation-context';
import { type DiagramRelatedEntity, getRelatedEntities } from '../../../../utils/diagram.utils';

type Props = { entityId: string; entityName: string };

export const DiagramRelatedMenu = ({ entityId, entityName }: Props) => {
  const { t } = useTranslation();
  const { fullModel, goToRelatedEntity } = use(DiagramNavigationContext);
  const { outgoing, incoming } = useMemo(
    () => getRelatedEntities(fullModel, entityId),
    [fullModel, entityId]
  );

  if (!outgoing.length && !incoming.length) return null;

  const renderGroup = (label: string, related: DiagramRelatedEntity[]) =>
    related.length > 0 && (
      <MenuGroup>
        <MenuGroupLabel>{label}</MenuGroupLabel>
        {related.map(({ id, label: name }) => (
          <MenuItem
            key={id}
            className="font-mono text-xs sm:text-xs"
            onClick={() => goToRelatedEntity(entityId, id)}
          >
            {name}
          </MenuItem>
        ))}
      </MenuGroup>
    );

  return (
    <div className="contents" onClick={event => event.stopPropagation()}>
      <Menu>
        <MenuTrigger
          aria-label={t('Go to relations of {{name}}', { name: entityName })}
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className="nodrag size-6 shrink-0 text-muted-foreground sm:size-6"
            />
          }
        >
          <DiagramIcon className="size-3.5 sm:size-3.5" />
        </MenuTrigger>
        <MenuPopup align="end">
          {renderGroup(t('Points to'), outgoing)}
          {renderGroup(t('Pointed to by'), incoming)}
        </MenuPopup>
      </Menu>
    </div>
  );
};
