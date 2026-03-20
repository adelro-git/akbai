'use client';

import { useState } from 'react';
import type { Database } from '@/lib/supabase/types';

type Receipt = Database['public']['Tables']['receipts']['Row'];

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format the date — receipts should be in UTC, display in Manila time
  const formatDate = (isoString: string | null) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('tl-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format amount from centavos to pesos with ₱ sign
  const formatPeso = (centavos: number | null) => {
    if (centavos === null || centavos === undefined) return '₱0.00';
    const pesos = centavos / 100;
    return `₱${pesos.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Determine confidence color
  const getConfidenceColor = (confidence: number | null) => {
    if (confidence === null || confidence === undefined) return 'bg-gray-500/20 text-gray-400';
    if (confidence >= 0.9) return 'bg-teal-light/20 text-teal-light';
    if (confidence >= 0.7) return 'bg-yellow-500/20 text-yellow-400';
    return 'bg-red-500/20 text-red-300';
  };

  // Determine confidence label
  const getConfidenceLabel = (confidence: number | null) => {
    if (confidence === null || confidence === undefined) return 'N/A';
    const percent = Math.round((confidence ?? 0) * 100);
    if (confidence >= 0.9) return `✓ ${percent}%`;
    if (confidence >= 0.7) return `△ ${percent}%`;
    return `✗ ${percent}%`;
  };

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="rounded-xl bg-card p-4 border border-gray-700 cursor-pointer transition-all hover:border-honey-light/50 active:scale-98"
    >
      {/* Main Content */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Vendor Name */}
          <h3 className="text-base font-semibold text-white truncate">
            {receipt.vendor_name || 'Unknown Vendor'}
          </h3>

          {/* Date */}
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(receipt.scanned_at)}
          </p>

          {/* Amount */}
          <p className="text-lg font-bold text-teal-light mt-2">
            {formatPeso(receipt.total_amount)}
          </p>
        </div>

        {/* Confidence Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getConfidenceColor(
            receipt.ocr_confidence
          )}`}
        >
          {getConfidenceLabel(receipt.ocr_confidence)}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col gap-3">
          {/* Category */}
          {receipt.category && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Kategorya:</span>
              <span className="text-white font-medium">{receipt.category}</span>
            </div>
          )}

          {/* Items Count */}
          {receipt.items_count !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Bilang ng items:</span>
              <span className="text-white font-medium">{receipt.items_count}</span>
            </div>
          )}

          {/* Payment Method */}
          {receipt.payment_method && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Paraan ng bayad:</span>
              <span className="text-white font-medium capitalize">
                {receipt.payment_method.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Subtotal */}
          {receipt.subtotal !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white font-medium">{formatPeso(receipt.subtotal)}</span>
            </div>
          )}

          {/* Tax */}
          {receipt.tax_amount !== null && receipt.tax_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">VAT/Tax:</span>
              <span className="text-white font-medium">{formatPeso(receipt.tax_amount)}</span>
            </div>
          )}

          {/* Discount */}
          {receipt.discount_amount !== null && receipt.discount_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Discount:</span>
              <span className="text-teal-light font-medium">
                -{formatPeso(receipt.discount_amount)}
              </span>
            </div>
          )}

          {/* Notes */}
          {receipt.notes && (
            <div className="mt-2 p-3 bg-card-alt rounded-lg">
              <p className="text-xs text-gray-400 font-semibold mb-1">Mga Tala</p>
              <p className="text-sm text-gray-200">{receipt.notes}</p>
            </div>
          )}

          {/* OCR Confidence Details */}
          <div className="mt-2 p-3 bg-card-alt rounded-lg">
            <p className="text-xs text-gray-400 font-semibold mb-2">OCR Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-honey-light to-teal-light transition-all"
                  style={{
                    width: `${Math.round((receipt.ocr_confidence || 0) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-sm font-semibold text-white min-w-fit">
                {Math.round((receipt.ocr_confidence || 0) * 100)}%
              </span>
            </div>
          </div>

          {/* Scan Status */}
          <div className="text-xs text-gray-400 text-center pt-2">
            {receipt.verified_by_user ? (
              <span className="text-teal-light font-semibold">✓ Verified ng User</span>
            ) : (
              <span>Hinihintay ang verification...</span>
            )}
          </div>
        </div>
      )}

      {/* Expand Indicator */}
      <div className="flex justify-center mt-2 text-xs text-gray-500">
        {isExpanded ? '▲' : '▼'}
      </div>
    </div>
  );
}
