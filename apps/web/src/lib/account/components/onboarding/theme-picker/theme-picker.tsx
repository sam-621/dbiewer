import { useTranslation } from 'react-i18next';

import { ThemeIcon } from '@/shared/components/theme-icon';
import { Fieldset, FieldsetLegend } from '@/shared/components/ui/fieldset';
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group';
import { useTheme } from '@/shared/hooks/use-theme';
import { THEME_OPTIONS, THEMES } from '@/shared/utils/theme.utils';

export const ThemePicker = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <Fieldset className="flex flex-col gap-2">
      <FieldsetLegend className="text-base/4.5 font-medium sm:text-sm/4">
        {t('What is your preferred theme?')}
      </FieldsetLegend>
      <ToggleGroup
        size="lg"
        className="gap-1"
        value={[theme]}
        onValueChange={([value]) => {
          const next = THEMES.find(option => option === value);
          if (next) setTheme(next);
        }}
      >
        {THEME_OPTIONS.map(({ value, label }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            className="gap-2 px-3 text-muted-foreground data-pressed:bg-accent data-pressed:text-foreground"
          >
            <ThemeIcon
              theme={value}
              className="size-5"
              variant={value === theme ? 'solid' : 'line'}
            />
            {t(label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Fieldset>
  );
};
