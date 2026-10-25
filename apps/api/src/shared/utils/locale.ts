export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const isLocale = (value: string): value is Locale => LOCALES.some(locale => locale === value);

const parseLanguageRange = (range: string) => {
  const [tag = '', ...params] = range.trim().split(';');
  const quality = params.map(param => param.trim()).find(param => param.startsWith('q='));
  const weight = quality ? Number(quality.slice(2)) : 1;

  return {
    language: tag.trim().split('-')[0]?.toLowerCase() ?? '',
    weight: Number.isNaN(weight) ? 0 : weight
  };
};

export const resolveLocale = (acceptLanguage: string | null): Locale => {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const match = acceptLanguage
    .split(',')
    .map(parseLanguageRange)
    .filter(range => range.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .find(range => isLocale(range.language));

  return match && isLocale(match.language) ? match.language : DEFAULT_LOCALE;
};
