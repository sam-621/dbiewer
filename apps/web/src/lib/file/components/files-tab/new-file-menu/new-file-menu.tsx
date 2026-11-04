import { useTranslation } from 'react-i18next';

import { useWorkspaceTabs } from '@/lib/workspace/hooks/use-workspace-tabs';
import { PlusIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/shared/components/ui/menu';

import { FILE_ICONS } from '../../../constants/file-types';

type Props = { isIconOnly?: boolean };

export const NewFileMenu = ({ isIconOnly = false }: Props) => {
  const { t } = useTranslation();
  const { openDraft } = useWorkspaceTabs();

  return (
    <Menu>
      {isIconOnly ? (
        <MenuTrigger aria-label={t('New file')} render={<Button variant="ghost" size="icon-sm" />}>
          <PlusIcon />
        </MenuTrigger>
      ) : (
        <MenuTrigger render={<Button variant="outline" />}>
          <PlusIcon />
          {t('New file')}
        </MenuTrigger>
      )}
      <MenuPopup align="end">
        <MenuItem onClick={() => openDraft('sql')}>
          <FILE_ICONS.sql />
          {t('SQL')}
        </MenuItem>
        <MenuItem onClick={() => openDraft('txt')}>
          <FILE_ICONS.txt />
          {t('Text')}
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
};
