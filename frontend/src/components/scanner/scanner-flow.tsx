'use client';

/**
 * Scanner Flow — Main orchestrator for the Resibo Scanner
 * Feature: Resibo Scanner (Build 3)
 * Role: State machine that drives the entire scan-to-save flow.
 *       Coordinates CameraCapture, OCR API call, ScanResults,
 *       DedupWarning, and transaction save.
 *
 * States: idle -> uploading -> reviewing -> saving -> done
 *         (error state reachable from any step)
 *
 * Flow: CameraCapture -> POST /api/ocr -> ScanResults -> DedupWarning (if dup)
 *       -> POST /api/expenses -> success
 *
 * Dependencies: /api/ocr, /api/expenses, DedupWarning, CameraCapture, ScanResults
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, Camera, Home, Save } from 'lucide-react';
import Link from 'next/link';
import type { ReceiptParseResult } from '@/lib/ocr/types';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { DedupWarning } from '@/components/ocr/dedup-warning';
import { CameraCapture } from './camera-capture';
import { ScanResults } from './scan-results';
import type { EditedScanData } from './scan-results';

// ============================================================
// Types
// ============================================================

type FlowState = 'idle' | 'uploading' | 'reviewing' | 'saving' | 'done' | 'error';

interface DedupInfo {
  is_duplicate: boolean;
  existing_transaction: Record<string, unknown> | null;
  receipt_hash: string | null;
}

interface OcrApiResponse {
  success: boolean;
  data?: ReceiptParseResult & { dedup: DedupInfo };
  error?: { code: string; message: string; message_tl: string };
}

// ============================================================
// Component
// ============================================================

export function ScannerFlow() {
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [scanResult, setScanResult] = useState<ReceiptParseResult | null>(null);
  const [dedupInfo, setDedupInfo] = useState<DedupInfo | null>(null);
  const [showDedup, setShowDedup] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<EditedScanData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ============================================================
  // Step 1: Image Captured -> Upload to OCR API
  // ============================================================

  const handleCapture = useCallback(async (file: File) => {
    setFlowState('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const json: OcrApiResponse = await res.json();

      if (!json.success || !json.data) {
        setErrorMessage(
          json.error?.message_tl ?? 'Hindi ko ma-scan ang resibo, boss. Baka malabo — i-try mo ulit o i-type mo manually?'
        );
        setFlowState('error');
        return;
      }

      // --- Store scan result and dedup info ---
      const { dedup, ...parseResult } = json.data;
      setScanResult(parseResult);
      setDedupInfo(dedup);
      setFlowState('reviewing');
    } catch {
      setErrorMessage('Hindi makapag-connect. I-check ang internet mo.');
      setFlowState('error');
    }
  }, []);

  // ============================================================
  // Step 2: User Edited Results -> Save Transaction
  // ============================================================

  const handleSave = useCallback(
    async (editedData: EditedScanData) => {
      // --- Check dedup before saving ---
      if (
        dedupInfo?.is_duplicate &&
        dedupInfo.existing_transaction &&
        !pendingSaveData
      ) {
        setPendingSaveData(editedData);
        setShowDedup(true);
        return;
      }

      setFlowState('saving');
      setErrorMessage('');

      try {
        const payload = {
          type: 'expense' as const,
          amount: editedData.amount,
          category: editedData.category,
          description: editedData.description || undefined,
          transaction_date: editedData.transaction_date || undefined,
          source: 'ocr' as const,
          merchant_name: editedData.merchant_name || undefined,
          receipt_hash: editedData.receipt_hash || undefined,
        };

        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!json.success) {
          setErrorMessage(
            json.error?.message_tl ?? 'Hindi ma-save ang resibo. Subukan muli.'
          );
          setFlowState('error');
          return;
        }

        setFlowState('done');
      } catch {
        setErrorMessage('Hindi makapag-connect. I-check ang internet mo.');
        setFlowState('error');
      }
    },
    [dedupInfo, pendingSaveData]
  );

  // ============================================================
  // Dedup: Save Anyway or Cancel
  // ============================================================

  const handleDedupSaveAnyway = useCallback(() => {
    setShowDedup(false);
    if (pendingSaveData) {
      // Clear dedup flag and save directly
      setDedupInfo(null);
      handleSave(pendingSaveData);
    }
  }, [pendingSaveData, handleSave]);

  const handleDedupCancel = useCallback(() => {
    setShowDedup(false);
    setPendingSaveData(null);
    // Stay on reviewing state
  }, []);

  // ============================================================
  // Navigation: Reset to start or go back
  // ============================================================

  const handleScanAnother = useCallback(() => {
    setScanResult(null);
    setDedupInfo(null);
    setPendingSaveData(null);
    setShowDedup(false);
    setErrorMessage('');
    setFlowState('idle');
  }, []);

  const handleCancelCapture = useCallback(() => {
    // Stay on idle — CameraCapture handles its own internal cancel
  }, []);

  const handleCancelReview = useCallback(() => {
    setScanResult(null);
    setDedupInfo(null);
    setFlowState('idle');
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      className="min-h-dvh pb-20 md:pb-6"
      data-testid="scanner-flow"
    >
      {/* --- Header --- */}
      <header className="px-4 pt-5 pb-3 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-surface-container-high/50"
          aria-label="Bumalik sa Dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </Link>
        <h1 className="text-on-surface text-lg font-extrabold">
          Resibo Scanner
        </h1>
      </header>

      {/* --- Main Content Area --- */}
      <div className="px-4">
        {/* --- Idle: Show CameraCapture --- */}
        {flowState === 'idle' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <IllustrationWrapper
                src="empty-states/first-scan.webp"
                alt="I-scan ang unang resibo mo"
                category="empty-state"
              />
            </div>
            <CameraCapture
              onCapture={handleCapture}
              onCancel={handleCancelCapture}
            />
          </div>
        )}

        {/* --- Uploading: Progress indicator --- */}
        {flowState === 'uploading' && (
          <div className="py-10 text-center space-y-4" data-testid="uploading-state">
            <div className="flex justify-center">
              <IllustrationWrapper
                src="features/scan-in-progress.webp"
                alt="Binabasa ang resibo"
                category="status"
              />
            </div>
            <div className="space-y-2">
              <p className="text-on-surface font-semibold text-base">
                Binabasa ko ang resibo mo...
              </p>
              <p className="text-on-surface-variant text-sm">
                Sandali lang, bini-basa ko ang mga detalye
              </p>
              {/* Animated loading bar */}
              <div className="w-48 h-1.5 bg-surface-container-high rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary-container rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        )}

        {/* --- Reviewing: Show ScanResults --- */}
        {flowState === 'reviewing' && scanResult && (
          <ScanResults
            data={scanResult}
            receiptHash={dedupInfo?.receipt_hash ?? null}
            onSave={handleSave}
            onCancel={handleCancelReview}
          />
        )}

        {/* --- Saving: Brief saving state --- */}
        {flowState === 'saving' && (
          <div className="py-10 text-center space-y-3" data-testid="saving-state">
            <div className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Save className="w-6 h-6 text-primary" />
            </div>
            <p className="text-on-surface font-semibold text-sm">
              Sine-save ang resibo...
            </p>
          </div>
        )}

        {/* --- Done: Success state --- */}
        {flowState === 'done' && (
          <div className="py-8 text-center space-y-5" data-testid="done-state">
            <div className="flex justify-center">
              <IllustrationWrapper
                src="features/scan-success.webp"
                alt="Na-save na ang resibo"
                category="status"
              />
            </div>
            <div className="space-y-1">
              <p className="text-on-surface font-bold text-lg">
                Na-save na ang resibo mo!
              </p>
              <p className="text-on-surface-variant text-sm">
                Na-record na sa expenses mo
              </p>
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={handleScanAnother}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3"
                data-testid="scan-another-btn"
              >
                <Camera className="w-5 h-5" />
                Mag-scan ulit
              </button>

              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3"
                data-testid="back-dashboard-btn"
              >
                <Home className="w-5 h-5" />
                Bumalik sa Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* --- Error: Retry or go back --- */}
        {flowState === 'error' && (
          <div className="py-8 text-center space-y-4" data-testid="error-state">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">!</span>
            </div>
            <div className="space-y-1">
              <p className="text-on-surface font-semibold text-base">
                May problema
              </p>
              <p className="text-on-surface-variant text-sm">
                {errorMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={handleScanAnother}
              className="inline-flex items-center gap-2 min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl px-6 py-3"
              data-testid="retry-btn"
            >
              Subukan ulit
            </button>
          </div>
        )}
      </div>

      {/* --- Dedup Warning Dialog --- */}
      {showDedup && dedupInfo?.existing_transaction && (
        <DedupWarning
          open={showDedup}
          existingTransaction={{
            id: String(dedupInfo.existing_transaction.id ?? ''),
            amount: Number(dedupInfo.existing_transaction.amount ?? 0),
            category: String(dedupInfo.existing_transaction.category ?? ''),
            description:
              dedupInfo.existing_transaction.description != null
                ? String(dedupInfo.existing_transaction.description)
                : null,
            transaction_date: String(
              dedupInfo.existing_transaction.transaction_date ?? ''
            ),
            merchant_name:
              dedupInfo.existing_transaction.merchant_name != null
                ? String(dedupInfo.existing_transaction.merchant_name)
                : null,
            created_at: String(dedupInfo.existing_transaction.created_at ?? ''),
          }}
          onSaveAnyway={handleDedupSaveAnyway}
          onCancel={handleDedupCancel}
        />
      )}
    </div>
  );
}

export default ScannerFlow;
