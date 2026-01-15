import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  nl: {
    translation: nlTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'nl', // Default to Dutch
    lng: 'nl', // Start with Dutch
    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'djoppie-language',
    },
  });

export default i18n;
