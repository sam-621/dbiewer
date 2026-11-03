import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckIcon, CopyIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { Logger } from '@/shared/utils/logger';

const COPIED_DURATION_MS = 1500;

type Props = {
  value: string;
  label: string;
  className?: string;
  tabIndex?: number;
  onCopy?: () => void;
};

export const CopyButton = ({ value, label, className, tabIndex, onCopy }: Props) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timeout = setTimeout(() => setIsCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      onCopy?.();
    } catch (error) {
      Logger.error(error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={isCopied ? t('Copied') : label}
      tabIndex={tabIndex}
      className={cn('text-muted-foreground', className)}
      onClick={copy}
    >
      {isCopied ? <CheckIcon className="text-success" /> : <CopyIcon />}
    </Button>
  );
};
