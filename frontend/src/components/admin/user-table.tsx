/**
 * User Table — Sortable admin user list
 * Feature: Admin Dashboard (Gap D10)
 * Role: Displays all users with name, email, tier, onboarding status,
 *       last active timestamp. Sortable by column.
 *       Fetches from /api/admin/users.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  subscription_tier: string;
  onboarding_completed: boolean;
  feature_flags: Record<string, boolean> | null;
  created_at: string;
  last_sign_in_at: string | null;
}

type SortField = 'email' | 'subscription_tier' | 'onboarding_completed' | 'last_sign_in_at' | 'created_at';

// ============================================================
// UserTable — Fetches and displays sortable user table
// ============================================================

export default function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
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
    fetchUsers();
  }, []);

  // --- Sort handler ---
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortAsc((a) => !a);
        return field;
      }
      setSortAsc(true);
      return field;
    });
  }, []);

  // --- Sort the user list ---
  const sorted = [...users].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    let cmp = 0;
    if (typeof valA === 'boolean') {
      cmp = (valA ? 1 : 0) - (valB ? 1 : 0);
    } else if (typeof valA === 'string') {
      cmp = valA.localeCompare(valB as string);
    }

    return sortAsc ? cmp : -cmp;
  });

  // --- Column header with sort indicator ---
  function SortHeader({ field, label }: { field: SortField; label: string }) {
    const arrow = sortField === field ? (sortAsc ? ' \u2191' : ' \u2193') : '';
    return (
      <th
        className="pb-2 font-semibold cursor-pointer select-none whitespace-nowrap"
        onClick={() => handleSort(field)}
      >
        {label}{arrow}
      </th>
    );
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
      <h2 className="text-lg font-bold text-on-surface mb-4">Users</h2>

      <table className="w-full text-sm text-left text-on-surface-variant">
        <thead>
          <tr>
            <SortHeader field="email" label="Email" />
            <th className="pb-2 font-semibold">Name</th>
            <SortHeader field="subscription_tier" label="Tier" />
            <SortHeader field="onboarding_completed" label="Onboarded" />
            <SortHeader field="last_sign_in_at" label="Last Active" />
            <SortHeader field="created_at" label="Joined" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((u) => (
            <tr key={u.id} className="text-on-surface hover:bg-surface-container-high transition-colors">
              <td className="py-2 pr-4">{u.email}</td>
              <td className="py-2 pr-4">{u.full_name ?? '-'}</td>
              <td className="py-2 pr-4 capitalize">{u.subscription_tier}</td>
              <td className="py-2 pr-4">{u.onboarding_completed ? 'Yes' : 'No'}</td>
              <td className="py-2 pr-4">
                {u.last_sign_in_at
                  ? new Date(u.last_sign_in_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })
                  : 'Never'}
              </td>
              <td className="py-2">
                {new Date(u.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
