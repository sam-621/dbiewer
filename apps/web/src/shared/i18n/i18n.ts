import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import en from './locales/en.json';
import es from './locales/es.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es }
  },
  lng: 'es',
  fallbackLng: 'en',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false }
});

export { i18n };
