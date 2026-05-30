'use client';

// ============================================================
// Dedup Warning Dialog — Gap C1 (Sprint 12)
// Feature: Resibo Scanner — Receipt Deduplication
//
// Purpose: Show a conversational Filipino warning when a duplicate
//          receipt is detected. Gives the user clear options:
//          save anyway (force) or cancel. Displays the existing
//          transaction details so the user can make an informed choice.
//
// Design: Uses AlertDialog (Radix) with design system tokens.
//         Touch targets ≥ 44px. No hardcoded hex colors.
// ============================================================

import { useRef, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Money from '@/components/ui/money';

// ============================================================
// Types
// ============================================================

interface ExistingTransaction {
  id: string;
  amount: number; // centavos
  category: string;
  description: string | null;
  transaction_date: string;
  merchant_name: string | null;
  created_at: string;
}

interface DedupWarningProps {
  /** Whether the dialog is open */
  open: boolean;
  /** The existing transaction that was found as a duplicate */
  existingTransaction: ExistingTransaction;
  /** Called when user chooses to save anyway */
  onSaveAnyway: () => void;
  /** Called when user cancels (does not save) */
  onCancel: () => void;
}

// ============================================================
// Component
// ============================================================

export function DedupWarning({
  open,
  existingTransaction,
  onSaveAnyway,
  onCancel,
}: DedupWarningProps) {
  // --- Refs for button handlers (React 19 controlled input bug) ---
  const saveAnywayRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleSaveAnyway = useCallback(() => {
    onSaveAnyway();
  }, [onSaveAnyway]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // --- Format existing transaction details for display ---
  const merchantDisplay =
    existingTransaction.merchant_name || 'Hindi kilala ang tindahan';
  const dateDisplay = existingTransaction.transaction_date;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-surface-container-lowest rounded-xl max-w-[calc(100vw-2rem)] sm:max-w-md">
        <AlertDialogHeader>
          {/* --- Title: warm conversational Filipino --- */}
          <AlertDialogTitle className="font-plus-jakarta text-on-surface font-bold text-lg">
            Mukhang na-scan mo na ito
          </AlertDialogTitle>

          {/* --- Description: show what was found --- */}
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-on-surface-variant text-sm">
              <p>
                May katulad na resibo na na-save kanina po — pareho ang halaga,
                petsa, at tindahan. Baka na-double scan?
              </p>

              {/* --- Existing transaction card --- */}
              <div className="bg-surface-container-low rounded-lg p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-on-surface">
                    {merchantDisplay}
                  </span>
                  <Money centavos={existingTransaction.amount} size="sm" countUp={false} />
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>{existingTransaction.category}</span>
                  <span>{dateDisplay}</span>
                </div>
              </div>

              <p>Gusto mo pa ring i-save ito?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {/* --- Cancel: secondary action, minimum 44px touch target --- */}
          <AlertDialogCancel
            ref={cancelRef}
            onClick={handleCancel}
            className="min-h-[44px] bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-lg font-semibold"
          >
            Huwag na, cancel
          </AlertDialogCancel>

          {/* --- Save Anyway: primary action --- */}
          <AlertDialogAction
            ref={saveAnywayRef}
            onClick={handleSaveAnyway}
            className="min-h-[44px] bg-primary-container text-on-primary hover:opacity-90 rounded-lg font-semibold"
          >
            I-save pa rin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DedupWarning;
