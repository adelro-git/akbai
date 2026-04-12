/**
 * Admin Layout — Auth guard for admin dashboard
 * Feature: Admin Dashboard (Gap D10)
 * Role: Server-side layout that checks if the current user is the admin.
 *       Non-admins get redirected to the main dashboard.
 *
 * Dependencies: createClient() for auth, isAdminEmail() for check
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin/auth';
import { SKIP_AUTH } from '@/lib/supabase/dev-auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- Auth Guard: Only admin email can access this layout ---
  if (!SKIP_AUTH) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">
          AKBai Admin
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Internal dashboard — users, revenue, flags
        </p>
      </header>
      <main>{children}</main>
    </div>
  );
}
