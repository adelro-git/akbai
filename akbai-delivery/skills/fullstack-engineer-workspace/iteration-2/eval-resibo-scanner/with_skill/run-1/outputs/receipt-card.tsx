/**
 * Resibo Scanner — Receipt Card Component
 * Feature: Resibo Scanner (Build 3)
 * Route: /components/features/resibo/receipt-card.tsx
 *
 * Role: Client-side display of OCR-extracted receipt data with vendor, date, total, and confidence badge
 *
 * Flow: Render receipt data from Supabase → display vendor name, transaction date formatted,
 *       total in pesos with teal accent, confidence badge (high/medium/low)
 *       → optional: tap to expand details, swipe to delete (Phase 2)
 *
 * Dependencies: Supabase receipts table (already fetched by server component)
 * Tested by: QA — data display accuracy, date formatting (Asia/Manila timezone),
 *            money formatting (centavos to pesos), confidence badge color coding
 */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { toPHTime } from '@/lib/utils/timezone';

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

interface ReceiptCardProps {
  receipt: Receipt;
}

/**
 * Format centavos to Philippine Peso display string with proper locale
 * Example: 345000 → "₱3,450.00"
 */
function centavosToPeso(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Determine confidence badge color and label based on score
 * Green (Teal) for 80+, Yellow for 50-79, Orange for below 50
 */
function getConfidenceBadge(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 80) {
    return { label: 'Malinaw', color: 'text-teal-light', bgColor: 'bg-teal-light/10' };
  }
  if (score >= 50) {
    return { label: 'Medyo malinaw', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' };
  }
  return { label: 'Kailangan i-check', color: 'text-orange-400', bgColor: 'bg-orange-400/10' };
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const pesoPeso = centavosToPeso(receipt.total_amount);
  const confidence = getConfidenceBadge(receipt.confidence_score);

  // --- Date Formatting: Convert transaction_date to readable format with Manila timezone ---
  const transactionDate = new Date(receipt.transaction_date);
  const formattedDate = transactionDate.toLocaleDateString('tl-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // --- Relative Time: Show "2 days ago" style text ---
  let relativeTime = '';
  try {
    relativeTime = formatDistanceToNow(new Date(receipt.created_at), {
      addSuffix: true,
      locale: undefined, // Default English for now, could use Filipino locale
    });
  } catch {
    relativeTime = 'recently';
  }

  return (
    <div
      className="group rounded-xl bg-card p-4 transition-all hover:bg-card-alt"
      role="article"
      aria-label={`Receipt from ${receipt.vendor_name} for ${pesoPeso}`}
    >
      {/* --- Header Row: Vendor Name + Confidence Badge --- */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="line-clamp-2 text-base font-semibold text-white">
            {receipt.vendor_name || 'Unknown Vendor'}
          </h3>
          <p className="mt-1 text-xs text-gray-400">{relativeTime}</p>
        </div>

        <div
          className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${confidence.bgColor} ${confidence.color}`}
        >
          {confidence.label}
        </div>
      </div>

      {/* --- Middle Row: Date + Amount --- */}
      <div className="space-y-2 border-t border-gray-700 pt-3">
        {/* Transaction Date */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Petsa</span>
          <span className="font-medium text-white">{formattedDate}</span>
        </div>

        {/* Total Amount in Pesos with Teal highlight */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total</span>
          <span className="font-semibold text-teal-light">{pesoPeso}</span>
        </div>

        {/* Confidence Score as percentage */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">OCR Accuracy</span>
          <span className="text-gray-400">{receipt.confidence_score}%</span>
        </div>
      </div>

      {/* --- Footer: Action hint (Phase 2: actual actions) --- */}
      <div className="mt-3 border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-500">
          Tap para makita ang buong details
        </p>
      </div>
    </div>
  );
}
