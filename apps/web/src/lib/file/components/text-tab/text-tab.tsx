import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { CommonFileFragment } from '@/lib/api/types';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';

import { useFileEditor } from '../../hooks/use-file-editor';
import { FileNameDialog } from '../file-name-dialog/file-name-dialog';

type Props = {
  connectionId: string;
  tabKey: string;
  file: CommonFileFragment | null;
};

export const TextTab = ({ connectionId, tabKey, file }: Props) => {
  const { t } = useTranslation();
  const { initialContent, isSaving, saveError, changeContent, save, nameDialog } = useFileEditor({
    connectionId,
    tabKey,
    type: 'txt',
    file
  });
  const [content, setContent] = useState(initialContent);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex min-h-12 shrink-0 items-center gap-2 border-b px-4 py-2">
        <Button size="sm" loading={isSaving} onClick={save}>
          {t('Save')}
        </Button>
      </header>
      {saveError && (
        <Alert variant="error" className="m-2 w-auto">
          <AlertDescription>{t(saveError)}</AlertDescription>
        </Alert>
      )}
      <Textarea
        unstyled
        aria-label={t('Text editor')}
        spellCheck={false}
        className="min-h-0 flex-1 *:h-full *:resize-none *:p-4 *:font-mono *:text-[13px]"
        value={content}
        onChange={event => {
          setContent(event.target.value);
          changeContent(event.target.value);
        }}
      />
      <FileNameDialog title={t('Save file')} {...nameDialog} />
    </div>
  );
};
