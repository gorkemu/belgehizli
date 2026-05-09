// frontend/src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationTR from './locales/tr/translation.json';
import translationEN from './locales/en/translation.json';

const resources = {
  tr: { translation: translationTR },
  en: { translation: translationEN }
};

i18n
  .use(LanguageDetector) // Tarayıcı dilini algılar ve localStorage'a kaydeder
  .use(initReactI18next) // React entegrasyonu
  .init({
    resources,
    fallbackLng: 'tr', // Algılanamazsa varsayılan dil TR
    interpolation: {
      escapeValue: false // React XSS korumasını kendi yaptığı için buna gerek yok
    }
  });

export default i18n;