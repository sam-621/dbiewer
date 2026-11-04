import { useTranslation } from 'react-i18next';

import { MagicWandIcon, PlayIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { Kbd } from '@/shared/components/ui/kbd';

import { useRunShortcutLabel } from '../../../hooks/use-run-shortcut-label';

type Props = {
  connectionName: string;
  isRunning: boolean;
  isSaving: boolean;
  onRun: () => void;
  onSave: () => void;
  onFormat: () => void;
};

export const SqlTabToolbar = ({
  connectionName,
  isRunning,
  isSaving,
  onRun,
  onSave,
  onFormat
}: Props) => {
  const { t } = useTranslation();
  const runShortcutLabel = useRunShortcutLabel();

  return (
    <header className="flex min-h-12 shrink-0 items-center gap-2 border-b px-4 py-2">
      <Button size="sm" loading={isRunning} onClick={onRun}>
        <PlayIcon variant="solid" />
        {t('Run')}
        <Kbd className="bg-primary-foreground/10 text-primary-foreground">{runShortcutLabel}</Kbd>
      </Button>
      <Button variant="ghost" size="sm" loading={isSaving} onClick={onSave}>
        {t('Save')}
      </Button>
      <Button variant="ghost" size="sm" onClick={onFormat}>
        <MagicWandIcon />
        {t('Format')}
      </Button>
      <p
        title={connectionName}
        className="ms-auto flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
        <span className="truncate">{connectionName}</span>
      </p>
    </header>
  );
};
