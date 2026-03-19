/**
 * Resibo Scanner — Main Page
 * Feature: Resibo Scanner (Build 3)
 * Route: /app/(app)/(features)/resibo/page.tsx
 *
 * Role: Server component that fetches user's recent receipts from Supabase
 *
 * Flow: Load authenticated user → fetch receipts ordered by created_at DESC
 *       → display scan button + receipt list or empty state
 *
 * Dependencies: Supabase (receipts table, auth), ScanButton client component
 * Tested by: QA — auth guard, data loading, empty state, receipt list display
 */

import { createClient } from '@/lib/supabase/server';
import { ScanButton } from '@/components/features/resibo/scan-button';
import { ReceiptCard } from '@/components/features/resibo/receipt-card';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Type definition for receipt record fetched from Supabase
 * Mirrors the receipts table schema with OCR results stored as JSON
 */
interface Receipt {
  id: string;
  user_id: string;
  storage_path: string;
  vendor_name: string;
  transaction_date: string;
  total_amount: number; // in centavos
  confidence_score: number; // 0-100
  ocr_raw: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export default async function ResiboPage() {
  // --- Auth Check: Verify user is authenticated ---
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Middleware should catch this, but throw as fallback
    throw new Error('Unauthorized access to Resibo Scanner');
  }

  // --- Data Fetch: Get recent receipts ordered by creation date ---
  const { data: receipts, error: dataError } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (dataError) {
    // Let error.tsx catch this via Next.js error boundary
    throw dataError;
  }

  // --- Empty State: No receipts scanned yet ---
  if (!receipts || receipts.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Resibo Scanner</h1>
          <p className="mt-1 text-sm text-gray-400">
            I-scan ang resibo, makikita mo agad ang gastos
          </p>
        </div>

        <ScanButton userId={user.id} />

        <EmptyState
          message_tl="Wala pang nai-scan na resibo. Simulan natin ngayon!"
          subtitle_tl="Tap ang button sa itaas para mag-scan ng resibo"
        />
      </div>
    );
  }

  // --- Display: Header, scan button, and receipt cards ---
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Resibo Scanner</h1>
        <p className="mt-1 text-sm text-gray-400">
          {receipts.length} resibo na-scan
        </p>
      </div>

      <ScanButton userId={user.id} />

      <div className="space-y-3">
        {receipts.map((receipt) => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))}
      </div>
    </div>
  );
}
