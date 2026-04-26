export const locales = ['fil', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fil'
export const localeCookieName = 'NEXT_LOCALE'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'fil' || value === 'en'
}

export function pickLocaleFromAcceptLanguage(
  header: string | null | undefined
): Locale {
  if (!header) return defaultLocale
  const lower = header.toLowerCase()
  if (lower.includes('fil') || lower.includes('tl')) return 'fil'
  if (lower.includes('en')) return 'en'
  return defaultLocale
}
