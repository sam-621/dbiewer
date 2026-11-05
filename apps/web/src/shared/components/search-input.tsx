import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { MagnifyingGlassIcon, XIcon } from '@/shared/components/icons/icons';
import { Button } from '@/shared/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/shared/components/ui/input-group';

type Props = {
  value: string;
  placeholder: string;
  className?: string;
  onValueChange: (value: string) => void;
};

export const SearchInput = ({ value, placeholder, className, onValueChange }: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onValueChange('');
    inputRef.current?.focus();
  };

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <MagnifyingGlassIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        size="sm"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={event => onValueChange(event.target.value)}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Clear search')}
            className="text-muted-foreground"
            onClick={clear}
          >
            <XIcon />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
};
