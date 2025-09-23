import * as Localization from 'expo-localization';

export function getLang() {
  const stored = localStorage.getItem('lang');
  if (stored) return stored;

  const locales = Localization.getLocales();
  const deviceLang = (Array.isArray(locales) && locales.length > 0 && locales[0].languageCode) 
    ? locales[0].languageCode 
    : 'en';

  localStorage.setItem('lang', deviceLang);
  return deviceLang;
}

export function setLang(lang) {
  if (typeof lang === 'string' && lang.length > 0) {
    localStorage.setItem('lang', lang);
  }
}