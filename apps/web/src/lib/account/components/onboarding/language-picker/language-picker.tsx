import { useTranslation } from 'react-i18next';

import { Fieldset, FieldsetLegend } from '@/shared/components/ui/fieldset';
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group';
import { LanguageFlag } from '@/shared/i18n/components/flags';
import { LANGUAGES } from '@/shared/i18n/i18n';

export const LanguagePicker = () => {
  const { t, i18n } = useTranslation();

  return (
    <Fieldset className="flex flex-col gap-2">
      <FieldsetLegend className="text-base/4.5 font-medium sm:text-sm/4">
        {t('What is your preferred language?')}
      </FieldsetLegend>
      <ToggleGroup
        size="lg"
        className="gap-1"
        value={i18n.resolvedLanguage ? [i18n.resolvedLanguage] : []}
        onValueChange={([value]) => {
          if (value) void i18n.changeLanguage(value);
        }}
      >
        {LANGUAGES.map(language => (
          <ToggleGroupItem
            key={language.code}
            value={language.code}
            className="gap-2 px-3 text-muted-foreground data-pressed:bg-accent data-pressed:text-foreground"
          >
            <LanguageFlag code={language.code} className="size-5 opacity-100" />
            {t(language.label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Fieldset>
  );
};
