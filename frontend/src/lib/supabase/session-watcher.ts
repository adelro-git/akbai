'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from './client';
import type { AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Flag set by components before calling signOut() so the watcher
 * can distinguish user-initiated sign-outs from session expiry.
 */
let userInitiatedSignOut = false;

/**
 * Call this BEFORE invoking supabase.auth.signOut() so the session
 * watcher knows the sign-out was intentional.
 */
export function markSignOutAsUserInitiated(): void {
  userInitiatedSignOut = true;
}

/**
 * Hook that listens for unexpected session expiry (token refresh
 * failure or non-user-initiated sign-out). Returns whether the
 * session has expired so the UI can show the expiry modal.
 *
 * Before signalling expiry it saves any chat draft from localStorage.
 */
export function useSessionWatcher(): { isSessionExpired: boolean } {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (event === 'SIGNED_OUT' && !userInitiatedSignOut) {
          // Preserve any in-progress chat draft
          saveChatDraft();
          setIsSessionExpired(true);
        }

        if (event === 'TOKEN_REFRESHED') {
          // Token refreshed successfully — session is healthy
          setIsSessionExpired(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isSessionExpired };
}

/**
 * Saves the current chat input value to localStorage so it can be
 * restored after re-login. Only saves if there is non-empty content.
 */
function saveChatDraft(): void {
  try {
    const input = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="chat-text-input"]'
    );
    if (input && input.value.trim()) {
      localStorage.setItem('akbai_chat_draft', input.value);
    }
  } catch {
    // Silently fail — draft saving is best-effort
  }
}
