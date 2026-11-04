import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
import { useWorkspaceTabs } from '@/lib/workspace/hooks/use-workspace-tabs';
import { getFileTabKey } from '@/lib/workspace/utils/workspace-tabs.utils';
import { FileIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/shared/components/ui/empty';
import { SidebarMenu, SidebarMenuSkeleton } from '@/shared/components/ui/sidebar';

import { FILE_EXTENSIONS } from '../../constants/file-types';
import { useGetFiles } from '../../hooks/use-get-files';
import { filterFiles } from '../../utils/file.utils';
import { FileNameDialog } from '../file-name-dialog/file-name-dialog';

import { FileRow } from './file-row/file-row';
import { NewFileMenu } from './new-file-menu/new-file-menu';
import { RemoveFileDialog } from './remove-file-dialog/remove-file-dialog';

type Props = { connectionId: string; search: string };

export const FilesTab = ({ connectionId, search }: Props) => {
  const { t } = useTranslation();
  const { files, isLoading, isError, isFetching, refetch } = useGetFiles(connectionId);
  const { tabs, activeKey, openFile, closeTab, renameFileTab } = useWorkspaceTabs();
  const [renamingFile, setRenamingFile] = useState<CommonFileFragment | null>(null);
  const [removingFile, setRemovingFile] = useState<CommonFileFragment | null>(null);

  if (isLoading) {
    return (
      <div role="status" aria-label={t('Loading files')} className="flex flex-col gap-1">
        {Array.from({ length: 6 }, (_, index) => (
          <SidebarMenuSkeleton key={index} className="h-7" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 px-2 py-1 text-sm text-muted-foreground">
        <p>{t("We couldn't load your files")}</p>
        <Button variant="outline" size="sm" loading={isFetching} onClick={() => refetch()}>
          {t('Try again')}
        </Button>
      </div>
    );
  }

  if (!files.length) {
    return (
      <Empty className="px-2 py-8 md:py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileIcon />
          </EmptyMedia>
          <EmptyTitle>{t('No files yet')}</EmptyTitle>
          <EmptyDescription>
            {t('The files you save on this connection show up here.')}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewFileMenu />
        </EmptyContent>
      </Empty>
    );
  }

  const query = search.trim();
  const visibleFiles = filterFiles(files, query);

  return (
    <>
      <div className="flex items-center justify-between gap-2 ps-2 pb-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {t('Saved')}
          <span>{files.length}</span>
        </p>
        <NewFileMenu isIconOnly />
      </div>
      {visibleFiles.length ? (
        <SidebarMenu className="gap-0">
          {visibleFiles.map(file => (
            <FileRow
              key={file.id}
              file={file}
              isActive={activeKey === getFileTabKey(file.id)}
              isDirty={tabs.some(
                tab => tab.kind === 'file' && tab.fileId === file.id && tab.isDirty
              )}
              onOpen={() =>
                openFile({ id: file.id, name: file.name, type: FILE_EXTENSIONS[file.type] })
              }
              onRename={() => setRenamingFile(file)}
              onRemove={() => setRemovingFile(file)}
            />
          ))}
        </SidebarMenu>
      ) : (
        <p className="px-2 py-1 text-sm text-muted-foreground">
          {t('No results for “{{search}}”', { search: query })}
        </p>
      )}
      {renamingFile && (
        <FileNameDialog
          isOpen
          title={t('Rename file')}
          connectionId={connectionId}
          file={renamingFile}
          getContent={() => renamingFile.content}
          onOpenChange={() => setRenamingFile(null)}
          onSuccess={({ name }) => {
            renameFileTab(getFileTabKey(renamingFile.id), name);
            setRenamingFile(null);
          }}
        />
      )}
      {removingFile && (
        <RemoveFileDialog
          file={removingFile}
          onClose={() => setRemovingFile(null)}
          onRemoved={() => {
            closeTab(getFileTabKey(removingFile.id));
            setRemovingFile(null);
          }}
        />
      )}
    </>
  );
};
