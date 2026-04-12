'use client';

/**
 * Notification Bell — In-app notification indicator with dropdown
 * Feature: Push Notifications (Gap B6)
 * Role: Shows a bell icon with unread count badge in the app header/nav.
 *       On click, opens a dropdown listing recent notifications.
 *       Clicking a notification marks it as read and navigates to its URL.
 *
 * Flow: Fetch notifications on mount → show badge count → click to open
 *       → click notification → mark read + navigate
 *
 * Dependencies: /api/push/notifications
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import type { NotificationRow } from '@/lib/push/types';

// ============================================================
// Relative Time — simple "X araw na ang nakalipas" formatter
// ============================================================

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Ngayon lang';
  if (diffMins < 60) return `${diffMins} min ang nakalipas`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} oras ang nakalipas`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Kahapon';
  return `${diffDays} araw ang nakalipas`;
}

// ============================================================
// Main Component
// ============================================================

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Fetch notifications ---
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/push/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unread_count);
        }
      }
    } catch {
      // Silent fail — bell just shows 0
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- Close dropdown on outside click ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // --- Handle notification click: mark read + navigate ---
  const handleNotificationClick = async (notif: NotificationRow) => {
    // Mark as read (optimistic)
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setOpen(false);

    // PATCH mark as read
    try {
      await fetch('/api/push/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id }),
      });
    } catch {
      // Silent — read state will sync next fetch
    }

    // Navigate if URL provided
    if (notif.url) {
      router.push(notif.url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} data-testid="notification-bell">
      {/* --- Bell button --- */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        data-testid="bell-button"
      >
        <Bell className="w-5 h-5 text-on-surface" />
        {/* --- Unread badge --- */}
        {!loading && unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-surface text-[10px] font-bold px-1"
            data-testid="unread-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* --- Dropdown --- */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-lg z-50"
          data-testid="notification-dropdown"
        >
          {/* Header */}
          <div className="px-4 py-3">
            <h3 className="text-sm font-semibold text-on-surface">Mga Notification</h3>
          </div>

          {/* Empty state */}
          {notifications.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-on-surface-variant">
                Wala pa kang notifications.
              </p>
            </div>
          )}

          {/* Notification list */}
          {notifications.map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => handleNotificationClick(notif)}
              className={`w-full text-left px-4 py-3 min-h-[44px] hover:bg-surface-container transition-colors ${
                !notif.read_at ? 'bg-surface-container-low' : ''
              }`}
              data-testid={`notification-item-${notif.id}`}
            >
              <div className="flex items-start gap-2">
                {/* Unread dot */}
                {!notif.read_at && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-container flex-shrink-0" />
                )}
                <div className={!notif.read_at ? '' : 'ml-4'}>
                  <p className="text-sm font-semibold text-on-surface line-clamp-1">
                    {notif.title}
                  </p>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-1">
                    {relativeTime(notif.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
