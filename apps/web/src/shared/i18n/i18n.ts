import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import en from './locales/en.json';
import es from './locales/es.json';

export const LANGUAGES = [
  { code: 'es', label: 'Spanish' },
  { code: 'en', label: 'English' }
] as const;

const LANGUAGE_STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'es';

const getStoredLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return LANGUAGES.find(language => language.code === stored)?.code ?? DEFAULT_LANGUAGE;
};

i18n.on('languageChanged', language => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
});

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es }
  },
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }
});

export { i18n };
