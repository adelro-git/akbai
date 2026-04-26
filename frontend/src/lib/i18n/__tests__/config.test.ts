import { describe, expect, it } from 'vitest'
import {
  defaultLocale,
  isLocale,
  pickLocaleFromAcceptLanguage,
} from '../config'

describe('i18n/config', () => {
  it('defaults to fil', () => {
    expect(defaultLocale).toBe('fil')
  })

  describe('isLocale', () => {
    it.each([
      ['fil', true],
      ['en', true],
      ['es', false],
      ['EN', false],
      [undefined, false],
      [null, false],
      ['', false],
    ])('isLocale(%p) === %s', (input, expected) => {
      expect(isLocale(input as string | null | undefined)).toBe(expected)
    })
  })

  describe('pickLocaleFromAcceptLanguage', () => {
    it('returns fil when header is missing', () => {
      expect(pickLocaleFromAcceptLanguage(null)).toBe('fil')
      expect(pickLocaleFromAcceptLanguage(undefined)).toBe('fil')
      expect(pickLocaleFromAcceptLanguage('')).toBe('fil')
    })

    it('matches fil from common Accept-Language strings', () => {
      expect(pickLocaleFromAcceptLanguage('fil-PH,fil;q=0.9,en;q=0.8')).toBe('fil')
      expect(pickLocaleFromAcceptLanguage('tl-PH,tl;q=0.9')).toBe('fil')
    })

    it('returns en when only english is present', () => {
      expect(pickLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en')
    })

    it('returns default fil when neither is matched', () => {
      expect(pickLocaleFromAcceptLanguage('es-ES,es;q=0.9')).toBe('fil')
    })
  })
})
