'use client';

/**
 * Admin Dashboard Page — Client Component (Sprint 15 Capacitor conversion)
 *
 * Per sprint-15-conversion-pattern.md §3 row 5: this page was already
 * client-component-shaped (all child components fetch their own data).
 * The only conversion is adding the `'use client'` directive — no fetch,
 * no useEffect needed here.
 *
 * Each child component (AdminStats, MrrCard, UserTable, FeatureFlagPanel,
 * FlagReviewQueue) holds its own client-side auth guard; the (app) layout
 * also gates the surface. No additional auth check needed at this level.
 *
 * Feature: Admin Dashboard (Gap D10)
 */

import AdminStats from '@/components/admin/admin-stats';
import MrrCard from '@/components/admin/mrr-card';
import UserTable from '@/components/admin/user-table';
import FlagReviewQueue from '@/components/admin/flag-review-queue';
import FeatureFlagPanel from '@/components/admin/feature-flag-panel';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* --- Top-level stats --- */}
      <AdminStats />

      {/* --- MRR breakdown --- */}
      <MrrCard />

      {/* --- User table --- */}
      <UserTable />

      {/* --- Feature flag toggles --- */}
      <FeatureFlagPanel />

      {/* --- Flag-as-wrong review queue --- */}
      <FlagReviewQueue />
    </div>
  );
}
