import { en } from './en';
import { fr } from './fr';

export const translations = {
  en,
  fr,
};

export const getTranslation = (language) => {
  return translations[language] || translations.en;
};

