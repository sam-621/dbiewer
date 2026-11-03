import { useTranslation } from 'react-i18next';

import { ThemeIcon } from '@/shared/components/theme-icon';
import { Menu, MenuPopup, MenuSeparator, MenuTrigger } from '@/shared/components/ui/menu';
import { UserAvatar } from '@/shared/components/user-avatar';
import { useTheme } from '@/shared/hooks/use-theme';
import { LanguageFlag } from '@/shared/i18n/components/flags';
import { LANGUAGES } from '@/shared/i18n/i18n';
import { cn } from '@/shared/utils/cn';
import { THEME_OPTIONS, THEMES } from '@/shared/utils/theme.utils';

import { useGetMe } from '../../hooks/use-get-me';

import { PreferenceRow } from './preference-row/preference-row';
import { SignOutItem } from './sign-out/sign-out-item';

export const UserMenu = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { me } = useGetMe();
  const user = me?.user;
  const name = user?.name?.trim();

  return (
    <Menu>
      <MenuTrigger
        aria-label={t('Open account menu')}
        className="flex min-w-0 shrink-0 cursor-pointer items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-popup-open:bg-accent"
      >
        <UserAvatar id={user?.id} image={user?.image} className="size-7.5" />
        <div className="grid min-w-0">
          <span className="truncate text-sm font-medium text-foreground">
            {name || user?.email}
          </span>
          {name && <span className="truncate text-xs text-muted-foreground">{user?.email}</span>}
        </div>
      </MenuTrigger>
      <MenuPopup className="w-58" side="bottom" align="end" sideOffset={4}>
        <PreferenceRow
          label={t('Language')}
          value={i18n.resolvedLanguage}
          onChange={language => void i18n.changeLanguage(language)}
          options={LANGUAGES.map(language => ({
            value: language.code,
            label: t(language.label),
            content: (
              <LanguageFlag
                code={language.code}
                className={cn(
                  'size-5 rounded-full object-cover transition-opacity',
                  language.code !== i18n.resolvedLanguage && 'opacity-75'
                )}
              />
            )
          }))}
        />
        <PreferenceRow
          label={t('Theme')}
          value={theme}
          onChange={value => {
            const next = THEMES.find(option => option === value);
            if (next) setTheme(next);
          }}
          options={THEME_OPTIONS.map(option => ({
            value: option.value,
            label: t(option.label),
            content: (
              <ThemeIcon
                theme={option.value}
                className="size-4"
                variant={option.value === theme ? 'solid' : 'line'}
              />
            )
          }))}
        />
        <MenuSeparator />
        <SignOutItem />
      </MenuPopup>
    </Menu>
  );
};
