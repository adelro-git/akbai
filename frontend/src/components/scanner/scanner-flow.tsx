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

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Camera, Home, Save, WifiOff } from 'lucide-react';
import Link from 'next/link';
import type { ReceiptParseResult } from '@/lib/ocr/types';
import {
  enqueueScan,
  flushScanQueue,
  scanQueueSize,
  type QueuedScan,
  type FlushOutcome,
} from '@/lib/ocr/offline-queue';
import { IllustrationWrapper } from '@/components/illustrations/IllustrationWrapper';
import { DedupWarning } from '@/components/ocr/dedup-warning';
import { CameraCapture } from './camera-capture';
import { ScanResults } from './scan-results';
import type { EditedScanData } from './scan-results';

// ============================================================
// Types
// ============================================================

// Sprint 18 §11 — added 'queued' for the offline-capture state: the resibo
// is saved locally and will sync on reconnect.
type FlowState = 'idle' | 'uploading' | 'reviewing' | 'saving' | 'done' | 'error' | 'queued';

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
// Offline bridge helpers (Sprint 18 §11)
//
// The offline queue persists images as base64 data URLs in localStorage; the
// OCR submit path consumes a `File`. These two helpers bridge the gap so a
// scan captured offline can be replayed byte-for-byte on reconnect.
// ============================================================

/** Read a captured File into a base64 data URL for localStorage persistence. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

/** Reconstruct a File from a persisted queued scan for OCR replay. */
async function queuedScanToFile(scan: QueuedScan): Promise<File> {
  const res = await fetch(scan.image_data_url);
  const blob = await res.blob();
  return new File([blob], scan.meta.filename, { type: scan.meta.mime_type });
}

/**
 * Sentinel for a retriable server/transport condition that should cause the
 * scan to be QUEUED (offline-style), not dropped to a hard error.
 *
 * F2: a 502/503 with an HTML body makes `res.json()` throw a SyntaxError (not a
 * TypeError), so a raw `err instanceof TypeError` check would misclassify a
 * server hiccup as a fatal error and DROP the captured resibo. `submitToOcr`
 * now wraps both "fetch threw" and "non-OK status / unparseable body" into this
 * one type so every retriable condition is queued — Maria never loses a resibo
 * on a server blip.
 */
class RetriableOcrError extends Error {
  constructor(message = 'OCR temporarily unavailable') {
    super(message);
    this.name = 'RetriableOcrError';
  }
}

/**
 * Treat a queue-worthy transport condition as a network error so we enqueue
 * rather than surface a hard error:
 *   - fetch's TypeError ("Failed to fetch" / "Load failed") — truly offline.
 *   - RetriableOcrError — server hiccup (non-OK status or non-JSON body).
 * A non-network throw (rare) falls through to the normal error state.
 */
function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError || err instanceof RetriableOcrError;
}

/**
 * F1: validate a replayed OCR result before we attempt a save. The /api/expenses
 * Zod schema requires a POSITIVE INTEGER centavo amount and a strict YYYY-MM-DD
 * date; a result that fails either would be rejected with a 400 and — under the
 * old flush — kept and re-OCR'd on every reconnect. We pre-check here so an
 * unreadable capture is dropped + reported instead of looping.
 */
const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function extractValidExpense(
  fields: ReceiptParseResult['fields']
): { amount: number; transaction_date: string; merchant_name?: string } | null {
  const amount = typeof fields.total?.value === 'number' ? fields.total.value : NaN;
  const date = typeof fields.date?.value === 'string' ? fields.date.value : '';

  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (!YYYY_MM_DD.test(date)) return null;

  return {
    amount,
    transaction_date: date,
    merchant_name:
      typeof fields.merchant?.value === 'string' && fields.merchant.value
        ? fields.merchant.value
        : undefined,
  };
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
  const [queuedCount, setQueuedCount] = useState<number>(0);
  // F1: surfaced when the background flush drops one or more unreadable/stuck
  // queued resibo so the user knows to re-scan them (conversational Filipino).
  const [flushNotice, setFlushNotice] = useState<string>('');

  // ============================================================
  // OCR submit — POST a File to /api/ocr and return the parsed payload.
  // Shared by the live-capture path and the offline-queue flush replay.
  // Throws a TypeError on network failure (fetch semantics) so callers can
  // distinguish "no signal" from "server said no".
  // ============================================================

  const submitToOcr = useCallback(
    async (file: File): Promise<ReceiptParseResult & { dedup: DedupInfo }> => {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });

      // F2: a non-OK status (e.g. 502/503 from a server hiccup, often with an
      // HTML body) is a retriable transport condition, NOT a fatal scan error —
      // queue it so the resibo survives. Rate-limit (429) is also transient.
      if (!res.ok) {
        throw new RetriableOcrError(`OCR request failed with status ${res.status}`);
      }

      // F2: parsing the body can throw a SyntaxError on a non-JSON (HTML) error
      // page. Treat that as retriable too rather than a hard drop.
      let json: OcrApiResponse;
      try {
        json = (await res.json()) as OcrApiResponse;
      } catch {
        throw new RetriableOcrError('OCR response was not valid JSON');
      }

      if (!json.success || !json.data) {
        // A 200 with success:false is a genuine scan failure (e.g. unreadable
        // image) — surface it as a hard error, do NOT queue/loop.
        throw new Error(
          json.error?.message_tl ??
            'Hindi ko ma-scan ang resibo, boss. Baka malabo — i-try mo ulit o i-type mo manually?'
        );
      }
      return json.data;
    },
    []
  );

  // ============================================================
  // Step 1: Image Captured -> Upload to OCR API
  //
  // Sprint 18 §11 — offline resilience: if the device is offline at capture
  // time, OR the OCR request fails with a network error, persist the resibo to
  // the local queue and show a warm "naka-offline ka" state instead of a hard
  // error. The queue is drained on the 'online' event (see effect below).
  // ============================================================

  const handleCapture = useCallback(
    async (file: File) => {
      setErrorMessage('');

      // --- Pre-flight: already offline → queue without even trying. ---
      const offline =
        typeof navigator !== 'undefined' && navigator.onLine === false;
      if (offline) {
        try {
          const dataUrl = await fileToDataUrl(file);
          enqueueScan({
            imageDataUrl: dataUrl,
            meta: { filename: file.name, mime_type: file.type || 'image/jpeg' },
          });
          setQueuedCount(scanQueueSize());
          setFlowState('queued');
        } catch {
          setErrorMessage('Hindi ma-save ang resibo offline. Subukan ulit.');
          setFlowState('error');
        }
        return;
      }

      setFlowState('uploading');

      try {
        const data = await submitToOcr(file);
        const { dedup, ...parseResult } = data;
        setScanResult(parseResult);
        setDedupInfo(dedup);
        setFlowState('reviewing');
      } catch (err) {
        // --- Network failure mid-request → queue for sync on reconnect. ---
        if (isNetworkError(err)) {
          try {
            const dataUrl = await fileToDataUrl(file);
            enqueueScan({
              imageDataUrl: dataUrl,
              meta: { filename: file.name, mime_type: file.type || 'image/jpeg' },
            });
            setQueuedCount(scanQueueSize());
            setFlowState('queued');
            return;
          } catch {
            /* fall through to the generic error below */
          }
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Hindi makapag-connect. I-check ang internet mo.'
        );
        setFlowState('error');
      }
    },
    [submitToOcr]
  );

  // ============================================================
  // Flush — replay queued scans through the OCR submit path. Called on the
  // 'online' event and on mount (in case the app reopened with a backlog).
  // Successes are removed from the queue inside flushScanQueue; we just keep
  // the visible counter in sync.
  // ============================================================

  const flushOfflineQueue = useCallback(async () => {
    if (scanQueueSize() === 0) return;

    // Count only the drops Maria needs to act on (unreadable / stuck). Duplicate
    // skips and clean saves are silent, so we can't reuse FlushResult.dropped
    // (which lumps all drops together) for the notice. Cap-exceeded drops happen
    // INSIDE flushScanQueue (after MAX_FLUSH_ATTEMPTS retries) and are derived
    // below as: dropped − unreadable − duplicate.
    let unreadableDrops = 0;
    let duplicateDrops = 0;

    const result = await flushScanQueue(async (scan): Promise<FlushOutcome> => {
      const file = await queuedScanToFile(scan);

      // --- Re-OCR. submitToOcr throws RetriableOcrError on a server hiccup and
      //     TypeError when offline; both classify as network → keep queued. A
      //     genuine success:false (unreadable) throws a plain Error → drop so it
      //     doesn't loop + re-spend OCR budget. ---
      let data: ReceiptParseResult & { dedup: DedupInfo };
      try {
        data = await submitToOcr(file);
      } catch (err) {
        if (isNetworkError(err)) return 'retry';
        // Hard OCR failure (unreadable image): unrecoverable — stop looping.
        unreadableDrops++;
        return 'drop';
      }

      // --- F1: validate BEFORE POSTing. An amount that isn't a positive integer
      //     centavo value, or a date that isn't strict YYYY-MM-DD, would be
      //     rejected by /api/expenses (400) and left stuck. Drop + notify. ---
      const valid = extractValidExpense(data.fields);
      if (!valid) {
        unreadableDrops++;
        return 'drop';
      }

      // --- F3: apply the same dedup the live path uses. /api/ocr already ran
      //     the hash+window check and flagged duplicates; on background sync we
      //     silently skip a duplicate rather than inserting a second copy. ---
      if (data.dedup.is_duplicate) {
        duplicateDrops++;
        return 'drop';
      }

      // --- Save the validated expense. Reuse the OCR-computed receipt_hash so
      //     the saved row matches the live-capture path's dedup fingerprint. ---
      let saveRes: Response;
      try {
        saveRes = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            amount: valid.amount,
            category: 'other_expense',
            merchant_name: valid.merchant_name,
            transaction_date: valid.transaction_date,
            receipt_hash: data.dedup.receipt_hash ?? undefined,
            source: 'ocr',
          }),
        });
      } catch {
        // Network drop mid-save → keep queued for the next reconnect.
        return 'retry';
      }

      if (!saveRes.ok) {
        // 5xx → transient (retry). Any other non-OK (e.g. a 400 we somehow
        // still hit) is unrecoverable for this payload → drop so it can't loop.
        return saveRes.status >= 500 ? 'retry' : 'drop';
      }

      let saveJson: { success?: boolean };
      try {
        saveJson = (await saveRes.json()) as { success?: boolean };
      } catch {
        return 'retry';
      }
      return saveJson.success ? 'saved' : 'drop';
    });

    setQueuedCount(scanQueueSize());

    // F1: tell the user about resibo we had to drop (unreadable, or stuck past
    // the attempt cap) so they can re-scan. Duplicate skips + clean saves stay
    // silent. Cap-exceeded drops = total dropped minus the ones we classified.
    const capExceededDrops = Math.max(
      0,
      result.dropped - unreadableDrops - duplicateDrops
    );
    const notifyCount = unreadableDrops + capExceededDrops;
    if (notifyCount > 0) {
      setFlushNotice(
        `Hindi ko mabasa nang maayos ang ${notifyCount} na naka-queue na resibo — paki-scan ulit.`
      );
    }
  }, [submitToOcr]);

  useEffect(() => {
    // Seed the visible counter + attempt a flush if the app reopened online
    // with a backlog from a previous offline session.
    setQueuedCount(scanQueueSize());
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      flushOfflineQueue().catch(() => {
        /* leave queued; will retry on next 'online' */
      });
    }

    const onOnline = () => {
      flushOfflineQueue().catch(() => {
        /* leave queued; will retry on next 'online' */
      });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      return () => window.removeEventListener('online', onOnline);
    }
    return undefined;
  }, [flushOfflineQueue]);

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
    setFlushNotice('');
    setQueuedCount(scanQueueSize());
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
        {/* --- F1: background-sync notice — some queued resibo were unreadable
                or stuck and got dropped; prompt a re-scan. Dismissible. --- */}
        {flushNotice && (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl bg-surface-container-high px-4 py-3"
            role="status"
            data-testid="flush-notice"
          >
            <WifiOff className="w-5 h-5 text-on-surface-variant shrink-0 mt-0.5" />
            <p className="flex-1 text-sm text-on-surface">{flushNotice}</p>
            <button
              type="button"
              onClick={() => setFlushNotice('')}
              className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center text-on-surface-variant text-sm font-semibold"
              aria-label="Isara ang abiso"
              data-testid="flush-notice-dismiss"
            >
              Sige
            </button>
          </div>
        )}

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

        {/* --- Queued: captured offline, will sync on reconnect (Sprint 18 §11) --- */}
        {flowState === 'queued' && (
          <div className="py-8 text-center space-y-5" data-testid="queued-state">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
              <WifiOff className="w-7 h-7 text-on-surface-variant" />
            </div>
            <div className="space-y-1">
              <p className="text-on-surface font-bold text-base">
                Naka-offline ka.
              </p>
              <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                Na-save ko ang resibo — i-sye-sync ko &apos;to pag may signal na ulit.
              </p>
              {queuedCount > 1 && (
                <p className="text-on-surface-variant text-xs">
                  {queuedCount} resibo ang naka-queue.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={handleScanAnother}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3"
                data-testid="queued-scan-another-btn"
              >
                <Camera className="w-5 h-5" />
                Mag-scan ulit
              </button>

              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3"
                data-testid="queued-back-dashboard-btn"
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
