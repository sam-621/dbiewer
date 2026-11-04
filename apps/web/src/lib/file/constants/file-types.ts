import type { FileType } from '@/lib/api/types';
import type { FileExtension } from '@/lib/workspace/utils/workspace-tabs.utils';
import { FileIcon, type Icon, StickyNoteIcon } from '@/shared/components/icons/icons';

export const FILE_EXTENSIONS: Record<FileType, FileExtension> = { SQL: 'sql', TXT: 'txt' };

export const FILE_TYPES: Record<FileExtension, FileType> = { sql: 'SQL', txt: 'TXT' };

export const FILE_ICONS: Record<FileExtension, Icon> = { sql: FileIcon, txt: StickyNoteIcon };
