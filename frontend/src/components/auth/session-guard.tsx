'use client';

import { useSessionWatcher } from '@/lib/supabase/session-watcher';
import SessionExpiryModal from './session-expiry-modal';

/**
 * Client component that watches for session expiry and shows
 * the expiry modal when the session dies unexpectedly.
 *
 * Placed in the (app) layout so it covers all authenticated pages.
 */
export default function SessionGuard() {
  const { isSessionExpired } = useSessionWatcher();

  return <SessionExpiryModal isOpen={isSessionExpired} />;
}
