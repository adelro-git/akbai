'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Palette = 'cream' | 'honey' | 'dawn'

const STORAGE_KEY = 'akbai-palette'
const DEFAULT_PALETTE: Palette = 'cream'

type PaletteContextValue = {
  palette: Palette
  setPalette: (next: Palette) => void
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

function readInitialPalette(): Palette {
  if (typeof document === 'undefined') return DEFAULT_PALETTE
  const attr = document.documentElement.getAttribute('data-palette')
  if (attr === 'cream' || attr === 'honey' || attr === 'dawn') return attr
  return DEFAULT_PALETTE
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>(readInitialPalette)

  useEffect(() => {
    if (palette === DEFAULT_PALETTE) {
      document.documentElement.removeAttribute('data-palette')
    } else {
      document.documentElement.setAttribute('data-palette', palette)
    }
    try {
      localStorage.setItem(STORAGE_KEY, palette)
    } catch {
      /* storage unavailable — non-fatal */
    }
  }, [palette])

  const setPalette = useCallback((next: Palette) => {
    setPaletteState(next)
  }, [])

  return (
    <PaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </PaletteContext.Provider>
  )
}

export function usePalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext)
  if (!ctx) {
    throw new Error('usePalette must be used inside <PaletteProvider>')
  }
  return ctx
}

/**
 * Per-route palette helper. Wrap a route segment to switch palette context for
 * that segment only, then restore the previous palette on unmount.
 */
export function PaletteScope({
  palette,
  children,
}: {
  palette: Palette
  children: ReactNode
}) {
  const ctx = useContext(PaletteContext)
  useEffect(() => {
    if (!ctx) return
    const previous = ctx.palette
    ctx.setPalette(palette)
    return () => {
      ctx.setPalette(previous)
    }
  }, [ctx, palette])
  return <>{children}</>
}
