'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isLocale, localeCookieName, type Locale } from './config'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export async function setLocaleCookie(locale: Locale) {
  if (!isLocale(locale)) {
    throw new Error(`Invalid locale: ${String(locale)}`)
  }
  const store = await cookies()
  store.set(localeCookieName, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: false,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
