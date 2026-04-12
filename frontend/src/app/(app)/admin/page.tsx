/**
 * Admin Dashboard Page — Overview with stats, users, MRR, flags
 * Feature: Admin Dashboard (Gap D10)
 * Role: Server page that renders admin components.
 *       Data fetching happens client-side in each component
 *       to keep the page simple and allow independent refresh.
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
