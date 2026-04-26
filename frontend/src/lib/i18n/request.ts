import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  pickLocaleFromAcceptLanguage,
  type Locale,
} from './config'

export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(localeCookieName)?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const headerStore = await headers()
  return pickLocaleFromAcceptLanguage(headerStore.get('accept-language'))
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale()
  const messages = (await import(`@/../messages/${locale}.json`)).default
  return { locale, messages }
})

export { defaultLocale }
