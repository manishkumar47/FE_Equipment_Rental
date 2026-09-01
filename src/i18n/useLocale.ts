import { useTranslation } from 'react-i18next';
import { LOCALE_STORAGE_KEY, type LocaleCode } from './locales';

/**
 * The single shared way to read/set the active locale. Nothing outside this
 * module (and the locale-resolution wrapper in AppRoutes) should read a
 * locale from headers, params, or i18next directly - see i18n bug #4.
 */
export function useLocale() {
  const { i18n } = useTranslation();

  const setLocale = (code: LocaleCode) => {
    if (i18n.language === code) return;
    void i18n.changeLanguage(code);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable (e.g. private browsing) - locale just won't persist across reloads
    }
  };

  return { locale: i18n.language as LocaleCode, setLocale };
}
