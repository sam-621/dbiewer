import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
import { BinIcon, DotsThreeHorizontalIcon, PencilIcon } from '@/shared/components/icons/icons';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/shared/components/ui/menu';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/shared/components/ui/sidebar';

import { FILE_EXTENSIONS, FILE_ICONS } from '../../../constants/file-types';
import { formatFileAge, getFileName } from '../../../utils/file.utils';

type Props = {
  file: CommonFileFragment;
  isDirty: boolean;
  isActive: boolean;
  onOpen: () => void;
  onRename: () => void;
  onRemove: () => void;
};

export const FileRow = ({ file, isDirty, isActive, onOpen, onRename, onRemove }: Props) => {
  const { t, i18n } = useTranslation();
  const Icon = FILE_ICONS[FILE_EXTENSIONS[file.type]];
  const name = getFileName(file);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="sm"
        title={name}
        className="pe-8 data-[active=true]:font-normal"
        isActive={isActive}
        onClick={onOpen}
      >
        <Icon />
        <span className="min-w-0 truncate">{name}</span>
        {isDirty && (
          <span
            role="img"
            aria-label={t('Unsaved changes')}
            className="size-1.5 shrink-0 rounded-full bg-primary"
          />
        )}
        <span className="ms-auto shrink-0 text-xs text-muted-foreground">
          {formatFileAge(file.updatedAt, i18n.language)}
        </span>
      </SidebarMenuButton>
      <Menu>
        <MenuTrigger
          render={<SidebarMenuAction aria-label={t('Actions for {{name}}', { name })} />}
        >
          <DotsThreeHorizontalIcon />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={onRename}>
            <PencilIcon />
            {t('Rename')}
          </MenuItem>
          <MenuItem variant="destructive" onClick={onRemove}>
            <BinIcon />
            {t('Delete')}
          </MenuItem>
        </MenuPopup>
      </Menu>
    </SidebarMenuItem>
  );
};
