'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ScanButton from './scan-button';
import ReceiptCard from './receipt-card';

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

export default function ResiboScannerPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error('Hindi ka naka-login');
      }

      // Fetch recent receipts
      const { data, error: fetchError } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        throw new Error(`Error fetching receipts: ${fetchError.message}`);
      }

      setReceipts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (newReceipt: Receipt) => {
    setReceipts([newReceipt, ...receipts]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">📸 Resibo Scanner</h1>
          <p className="text-sm text-slate-600 mt-1">Scan ang iyong receipts at i-track ang gastos</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Scan Button */}
        <ScanButton onScanSuccess={handleScanSuccess} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Error: </span>
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!loading && receipts.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Walang resibo pa</h2>
            <p className="text-slate-600">
              Mag-scan ng receipt gamit ang camera upang magsimula
            </p>
          </div>
        )}

        {/* Receipts List */}
        {!loading && receipts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Mga Nakatagal na Resibo ({receipts.length})
            </h2>
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
