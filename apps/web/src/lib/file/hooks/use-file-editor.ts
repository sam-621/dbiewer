import { useRef, useState } from 'react';

import type { CommonFileFragment } from '@/lib/api/types';
import { useWorkspaceTabs } from '@/lib/workspace/hooks/use-workspace-tabs';
import type { FileExtension } from '@/lib/workspace/utils/workspace-tabs.utils';

import { FILE_TYPES } from '../constants/file-types';

import { useFileDraft } from './use-file-draft';
import { useSaveFile } from './use-save-file';
import { useSaveShortcut } from './use-save-shortcut';

type Params = {
  connectionId: string;
  tabKey: string;
  type: FileExtension;
  file: CommonFileFragment | null;
};

export const useFileEditor = ({ connectionId, tabKey, type, file }: Params) => {
  const { changeTabDirty, replaceDraftTab } = useWorkspaceTabs();
  const { saveFile, isLoading: isSaving } = useSaveFile();
  const { storedContent, changeDraft, removeDraft } = useFileDraft(connectionId, tabKey);
  const [initialContent] = useState(() => storedContent ?? file?.content ?? '');
  const contentRef = useRef(initialContent);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const changeContent = (content: string) => {
    contentRef.current = content;

    const isDirty = content !== (file?.content ?? '');
    if (isDirty) changeDraft(content);
    else removeDraft();

    changeTabDirty(tabKey, isDirty);
  };

  const save = async () => {
    if (!file) return setIsNameDialogOpen(true);
    if (isSaving) return;

    const result = await saveFile({
      id: file.id,
      connectionId,
      name: file.name,
      type: file.type,
      content: contentRef.current
    });

    setSaveError(result.isSuccess ? null : result.error);
    if (!result.isSuccess) return;

    removeDraft();
    changeTabDirty(tabKey, false);
  };

  const finishDraft = (saved: CommonFileFragment) => {
    setIsNameDialogOpen(false);
    removeDraft();
    replaceDraftTab(tabKey, saved);
  };

  useSaveShortcut(() => void save());

  return {
    initialContent,
    isSaving,
    saveError,
    changeContent,
    save: () => void save(),
    nameDialog: {
      connectionId,
      file: { name: '', type: FILE_TYPES[type] },
      isOpen: isNameDialogOpen,
      onOpenChange: setIsNameDialogOpen,
      getContent: () => contentRef.current,
      onSuccess: finishDraft
    }
  };
};
