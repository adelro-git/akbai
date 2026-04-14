'use client';

/**
 * Notification Settings — Push notification preference toggles
 * Feature: Push Notifications (Gap B6)
 * Role: Displays per-notification-type toggles in the profile page.
 *       Handles permission requests and subscribe/unsubscribe flow.
 *
 * Flow: Check push support → fetch preferences → render toggles
 *       → on toggle click, update preference via PATCH API
 *       → on enable button, request permission + subscribe
 *
 * Dependencies: /api/push/preferences, lib/push/register
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isCurrentlySubscribed,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
} from '@/lib/push';
import type { NotificationType, NotificationPreference } from '@/lib/push/types';

// ============================================================
// Permission State Badge — shows current notification permission
// ============================================================

function PermissionBadge({ permission }: { permission: NotificationPermission | 'unsupported' | 'loading' }) {
  if (permission === 'loading') return null;

  if (permission === 'unsupported') {
    return (
      <p className="text-xs text-on-surface-variant">
        Hindi supported ang push notifications sa browser na ito.
      </p>
    );
  }

  if (permission === 'denied') {
    return (
      <p className="text-xs text-destructive">
        Naka-block ang notifications. I-check ang browser settings mo para i-allow.
      </p>
    );
  }

  return null;
}

// ============================================================
// Main Component
// ============================================================

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  // Ref to track if component is mounted (avoid state updates after unmount)
  const mountedRef = useRef(true);

  // --- Initialize: check support, permission, subscription, and fetch prefs ---
  const initialize = useCallback(async () => {
    const pushSupported = isPushSupported();
    if (!mountedRef.current) return;
    setSupported(pushSupported);

    if (!pushSupported) {
      setPermission('unsupported');
      setLoading(false);
      return;
    }

    const currentPermission = getNotificationPermission();
    if (!mountedRef.current) return;
    setPermission(currentPermission);

    const currentlySubscribed = await isCurrentlySubscribed();
    if (!mountedRef.current) return;
    setSubscribed(currentlySubscribed);

    // Fetch notification preferences from API
    try {
      const res = await fetch('/api/push/preferences');
      if (res.ok) {
        const json = await res.json();
        if (mountedRef.current && json.success) {
          setPreferences(json.data.preferences);
        }
      }
    } catch {
      // Preferences fetch failed — use empty array (defaults shown as enabled)
    }

    if (mountedRef.current) setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    initialize();
    return () => {
      mountedRef.current = false;
    };
  }, [initialize]);

  // --- Handle enable push notifications ---
  const handleEnablePush = async () => {
    setSubscribing(true);
    const result = await subscribeToPush();
    if (mountedRef.current) {
      if (result.success) {
        setSubscribed(true);
        setPermission('granted');
        // Re-fetch preferences (subscribe endpoint creates defaults)
        const res = await fetch('/api/push/preferences');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setPreferences(json.data.preferences);
        }
      }
      setSubscribing(false);
    }
  };

  // --- Handle disable push notifications ---
  const handleDisablePush = async () => {
    setSubscribing(true);
    const result = await unsubscribeFromPush();
    if (mountedRef.current) {
      if (result.success) {
        setSubscribed(false);
      }
      setSubscribing(false);
    }
  };

  // --- Handle toggle individual preference ---
  const handleTogglePreference = async (notifType: NotificationType, currentEnabled: boolean) => {
    // Optimistic update
    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === notifType ? { ...p, enabled: !currentEnabled } : p
      )
    );

    try {
      const res = await fetch('/api/push/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_type: notifType, enabled: !currentEnabled }),
      });

      if (!res.ok) {
        // Revert optimistic update
        setPreferences((prev) =>
          prev.map((p) =>
            p.notification_type === notifType ? { ...p, enabled: currentEnabled } : p
          )
        );
      }
    } catch {
      // Revert on network error
      setPreferences((prev) =>
        prev.map((p) =>
          p.notification_type === notifType ? { ...p, enabled: currentEnabled } : p
        )
      );
    }
  };

  // --- Get preference state for a notification type ---
  const isEnabled = (notifType: NotificationType): boolean => {
    const pref = preferences.find((p) => p.notification_type === notifType);
    return pref ? pref.enabled : true; // Default enabled if no preference row
  };

  // --- Loading state ---
  if (loading) {
    return (
      <section
        className="bg-surface-container rounded-2xl p-4"
        aria-label="Notification settings"
        data-testid="section-notifications"
      >
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary-container" />
          <h2 className="text-base font-semibold text-on-surface">Mga Notification</h2>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-container-high rounded w-3/4" />
          <div className="h-10 bg-surface-container-high rounded" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-surface-container rounded-2xl p-4"
      aria-label="Notification settings"
      data-testid="section-notifications"
    >
      {/* --- Section Header --- */}
      <div className="flex items-center gap-2 mb-1">
        <Bell className="w-5 h-5 text-primary-container" />
        <h2 className="text-base font-semibold text-on-surface">Mga Notification</h2>
      </div>
      <p className="text-xs text-on-surface-variant mb-4">
        I-on mo ito para hindi mo ma-miss ang mga deadline
      </p>

      {/* --- Permission status --- */}
      <PermissionBadge permission={permission} />

      {/* --- Enable/Disable push subscription --- */}
      {supported && permission !== 'denied' && (
        <div className="mb-4">
          {!subscribed ? (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={subscribing}
              className="flex items-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary rounded-xl px-4 py-3 font-semibold text-sm transition-colors disabled:opacity-50"
              data-testid="enable-push-btn"
            >
              <BellRing className="w-5 h-5" />
              {subscribing ? 'Ina-activate...' : 'I-activate ang push notifications'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisablePush}
              disabled={subscribing}
              className="flex items-center gap-2 w-full min-h-[44px] bg-surface-container-high text-on-surface-variant rounded-xl px-4 py-3 font-semibold text-sm transition-colors disabled:opacity-50"
              data-testid="disable-push-btn"
            >
              <BellOff className="w-5 h-5" />
              {subscribing ? 'Dina-disable...' : 'I-off ang push notifications'}
            </button>
          )}
        </div>
      )}

      {/* --- Per-type toggles (always visible; disabled until subscribed) --- */}
      <div className="space-y-3" data-testid="notification-toggles">
        {!subscribed && supported && permission !== 'denied' && (
          <p className="text-xs text-on-surface-variant italic">
            I-activate muna ang push notifications para magamit ang mga toggle sa baba.
          </p>
        )}
        {NOTIFICATION_TYPES.map((notifType) => {
          const enabled = isEnabled(notifType);
          const disabled = !subscribed;
          return (
            <div
              key={notifType}
              className={`flex items-center justify-between min-h-[44px] ${disabled ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 mr-3">
                <p className="text-sm font-medium text-on-surface">
                  {NOTIFICATION_TYPE_LABELS[notifType]}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {NOTIFICATION_TYPE_DESCRIPTIONS[notifType]}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={disabled}
                onClick={() => handleTogglePreference(notifType, enabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                  enabled ? 'bg-primary-container' : 'bg-surface-container-high'
                }`}
                data-testid={`toggle-${notifType}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
