import { createClient } from '@/lib/supabase/server';
import { ScanButton } from '@/components/features/resibo/scan-button';
import { ReceiptCard } from '@/components/features/resibo/receipt-card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = {
  title: 'Resibo Scanner — AKBai',
  description: 'I-scan ang iyong mga resibo para sa OCR at tracking',
};

export default async function ResiboPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Fetch recent receipts for this user, ordered newest first
  const { data: receipts, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('scanned_at', { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">Resibo Scanner</h1>
        <p className="text-sm text-gray-400">
          I-scan ang mga receipts at i-track ang gastos mo
        </p>
      </div>

      {/* Scan Button */}
      <ScanButton userId={user.id} />

      {/* Divider */}
      <div className="h-px bg-card my-2" />

      {/* Recent Receipts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Mga Kamakailan na Scan
        </h2>

        {!receipts || receipts.length === 0 ? (
          <EmptyState message_tl="Walang scanned receipts pa. I-scan natin ang una!" />
        ) : (
          <div className="flex flex-col gap-3">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
