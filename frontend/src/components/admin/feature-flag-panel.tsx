/**
 * Feature Flag Panel — Grid of users x flags with toggle switches
 * Feature: Admin Dashboard (Gap D10)
 * Role: Displays all users and their feature flags. Admin can toggle
 *       any flag for any user via PATCH /api/admin/feature-flags.
 *       Uses useRef for toggle state to avoid React 19 controlled input issues.
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { FLAGS } from '@/lib/feature-flags/flags';

// ============================================================
// Types
// ============================================================

interface UserFlags {
  id: string;
  email: string;
  full_name: string | null;
  feature_flags: Record<string, boolean> | null;
}

// ============================================================
// All known flag names for column headers
// ============================================================

const ALL_FLAGS = Object.values(FLAGS);

// ============================================================
// FeatureFlagPanel — Grid of users x flags with toggles
// ============================================================

export default function FeatureFlagPanel() {
  const [users, setUsers] = useState<UserFlags[]>([]);
  const [loading, setLoading] = useState(true);
  const togglingRef = useRef<Set<string>>(new Set());
  const [, forceRender] = useState(0);

  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch('/api/admin/feature-flags');
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, []);

  // --- Toggle handler ---
  async function handleToggle(userId: string, flag: string, currentValue: boolean) {
    const key = `${userId}:${flag}`;
    if (togglingRef.current.has(key)) return;

    togglingRef.current.add(key);
    forceRender((n) => n + 1);

    const newValue = !currentValue;

    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, flag, value: newValue }),
      });
      const json = await res.json();
      if (json.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  feature_flags: {
                    ...(u.feature_flags ?? {}),
                    [flag]: newValue,
                  },
                }
              : u
          )
        );
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      togglingRef.current.delete(key);
      forceRender((n) => n + 1);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-surface-container p-6 shadow-sm animate-pulse h-40" />
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container p-6 shadow-sm">
        <p className="text-on-surface-variant text-sm">No users found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-container p-6 shadow-sm overflow-x-auto">
      <h2 className="text-lg font-bold text-on-surface mb-4">Feature Flags</h2>

      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-on-surface-variant">
            <th className="pb-2 font-semibold pr-4">User</th>
            {ALL_FLAGS.map((flag) => (
              <th key={flag} className="pb-2 font-semibold text-center px-2 whitespace-nowrap">
                {flag.replace(/_/g, ' ').replace(/ enabled$/i, '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-on-surface">
              <td className="py-2 pr-4 whitespace-nowrap">
                {u.full_name ?? u.email}
              </td>
              {ALL_FLAGS.map((flag) => {
                const isOn = u.feature_flags?.[flag] ?? false;
                const toggleKey = `${u.id}:${flag}`;
                const isToggling = togglingRef.current.has(toggleKey);

                return (
                  <td key={flag} className="py-2 text-center px-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(u.id, flag, isOn)}
                      disabled={isToggling}
                      className={`
                        w-10 h-6 rounded-full relative transition-colors min-h-[44px] min-w-[44px]
                        flex items-center justify-center
                        ${isOn ? 'bg-primary' : 'bg-outline-variant'}
                        ${isToggling ? 'opacity-50' : ''}
                      `}
                      aria-label={`Toggle ${flag} for ${u.email}`}
                    >
                      <span
                        className={`
                          absolute w-4 h-4 rounded-full bg-on-primary transition-transform
                          ${isOn ? 'translate-x-2' : '-translate-x-2'}
                        `}
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
