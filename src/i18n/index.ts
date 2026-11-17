import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { nbNO } from './nb-NO'

/**
 * The i18n layer (FR-I18N-1). Import this module once, from `main.tsx`, before
 * anything renders — `useTranslation` reads the instance initialised here.
 *
 * Only `nb-NO` ships (ADR-0003). Adding a locale is a resource file, an entry
 * in `SUPPORTED_LOCALES` and nothing else: no component changes (FR-I18N-2).
 */

export const DEFAULT_LOCALE = 'nb-NO'

export interface SupportedLocale {
  /** BCP 47 tag, as stored on the user's profile and sent to `PATCH /me`. */
  code: string
  /** Key under `locales` in the resources, so the name is itself translated. */
  labelKey: string
}

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: 'nb-NO', labelKey: 'locales.nb-NO' },
]

export function isSupportedLocale(locale: string | null | undefined): boolean {
  return SUPPORTED_LOCALES.some((supported) => supported.code === locale)
}

void i18n.use(initReactI18next).init({
  resources: {
    'nb-NO': { translation: nbNO },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES.map((locale) => locale.code),
  interpolation: {
    // React escapes for us; letting i18next escape too turns "Kartverkets
    // høydedata" into entities inside JSX.
    escapeValue: false,
  },
})

/**
 * Switches the UI language and keeps `<html lang>` truthful with it — screen
 * readers and browser translation both read that attribute, not our state.
 *
 * Unknown or missing locales are ignored rather than blanking the UI: the
 * profile may carry a locale a later release added and this one does not have.
 */
export function applyLocale(locale: string | null | undefined): void {
  const next = isSupportedLocale(locale) ? (locale as string) : DEFAULT_LOCALE
  if (i18n.language !== next) void i18n.changeLanguage(next)
  document.documentElement.lang = next
}

export default i18n
