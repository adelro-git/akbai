'use client';

import { useState } from 'react';

interface Receipt {
  id: string;
  user_id: string;
  vendor_name: string;
  transaction_date: string;
  total_amount: number;
  currency: string;
  confidence_score: number;
  raw_text: string;
  created_at: string;
  image_url: string;
}

interface ReceiptCardProps {
  receipt: Receipt;
}

export default function ReceiptCard({ receipt }: ReceiptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format currency as Philippine Peso
  const formatCurrency = (amount: number): string => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fil-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Determine confidence level and color
  const getConfidenceLevel = (score: number): { label: string; color: string; bg: string } => {
    if (score >= 0.9) {
      return { label: 'Mataas', color: 'text-green-700', bg: 'bg-green-100' };
    } else if (score >= 0.75) {
      return { label: 'Katamtaman', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    } else if (score >= 0.6) {
      return { label: 'Mababa', color: 'text-orange-700', bg: 'bg-orange-100' };
    }
    return { label: 'Napakababa', color: 'text-red-700', bg: 'bg-red-100' };
  };

  const confidence = getConfidenceLevel(receipt.confidence_score);
  const confidencePercent = Math.round(receipt.confidence_score * 100);

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Main Card Content */}
      <div className="p-4 space-y-4">
        {/* Vendor Name and Confidence Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {receipt.vendor_name || '(Hindi natukoy)'}
            </h3>
            <p className="text-sm text-slate-500">
              {formatDate(receipt.transaction_date)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${confidence.bg} ${confidence.color}`}>
            {confidence.label} ({confidencePercent}%)
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Kabuuang Halaga</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(receipt.total_amount)}
          </p>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
        >
          <span>{isExpanded ? 'Magpakita ng Mas Kaunti' : 'Magpakita ng Detalye'}</span>
          <span className="text-lg">{isExpanded ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
          {/* Image Preview */}
          {receipt.image_url && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase">Preview</p>
              <img
                src={receipt.image_url}
                alt={`Resibo from ${receipt.vendor_name}`}
                className="w-full max-h-48 object-contain rounded-lg bg-white border border-slate-200"
              />
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Vendor Name
              </p>
              <p className="text-sm text-slate-900 font-medium break-words">
                {receipt.vendor_name || '(Hindi natukoy)'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Petsa
              </p>
              <p className="text-sm text-slate-900 font-medium">
                {formatDate(receipt.transaction_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Kabuuang Halaga
              </p>
              <p className="text-sm text-slate-900 font-bold">
                {formatCurrency(receipt.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
                Confidence
              </p>
              <p className={`text-sm font-bold ${confidence.color}`}>
                {confidencePercent}%
              </p>
            </div>
          </div>

          {/* Raw OCR Text */}
          {receipt.raw_text && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase">
                OCR Text
              </p>
              <div className="bg-white rounded-lg p-3 border border-slate-200 max-h-32 overflow-y-auto">
                <p className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono">
                  {receipt.raw_text}
                </p>
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Naka-scan noong: {formatDate(receipt.created_at)}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
            >
              📋 Kopyahin
            </button>
            <button
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
            >
              🗑️ Tanggalin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
