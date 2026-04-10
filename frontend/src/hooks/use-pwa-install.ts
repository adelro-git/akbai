/**
 * PWA Install Hook — Manages beforeinstallprompt event and install state
 * Feature: PWA Install Guide (Sprint 12, Gaps B7+D9)
 * Role: Detects platform, captures install prompt, tracks installed state
 *
 * Flow: Detect platform → listen for beforeinstallprompt → expose promptInstall()
 *       → track display-mode change for post-install detection
 *
 * Dependencies: None (browser APIs only)
 * Tested by: QA — platform detection, prompt capture, install state tracking
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================
// Platform Detection Types
// ============================================================

export type Platform = 'ios' | 'android' | 'desktop';

export interface PwaInstallState {
  /** Detected platform */
  platform: Platform;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Whether the native install prompt is available (Android Chrome) */
  canPrompt: boolean;
  /** Trigger the native install prompt (Android Chrome only) */
  promptInstall: () => Promise<boolean>;
}

// ============================================================
// Platform Detection — userAgent + standalone check
// ============================================================

/** Detect if running on iOS (Safari or in-app browser) */
export function detectIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Detect if running on Android */
export function detectIsAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/** Detect the platform category */
export function detectPlatform(): Platform {
  if (detectIsIOS()) return 'ios';
  if (detectIsAndroid()) return 'android';
  return 'desktop';
}

/** Check if the app is already in standalone (installed) mode */
export function detectIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari standalone mode
  if ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true) return true;
  // Android/Desktop — display-mode: standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

// ============================================================
// Hook — usePwaInstall
// ============================================================

export function usePwaInstall(): PwaInstallState {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [isInstalled, setIsInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // --- Detect platform and install state on mount ---
  useEffect(() => {
    setPlatform(detectPlatform());
    setIsInstalled(detectIsInstalled());
  }, []);

  // --- Capture beforeinstallprompt event (Android Chrome) ---
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // --- Track post-install via display-mode change ---
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const displayHandler = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setCanPrompt(false);
      }
    };
    mediaQuery.addEventListener('change', displayHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mediaQuery.removeEventListener('change', displayHandler);
    };
  }, []);

  // --- Trigger native install prompt ---
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) return false;
    try {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanPrompt(false);
        deferredPromptRef.current = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { platform, isInstalled, canPrompt, promptInstall };
}

// ============================================================
// BeforeInstallPromptEvent type — not in standard lib
// ============================================================

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
