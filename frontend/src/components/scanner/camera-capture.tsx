'use client';

/**
 * Camera Capture — Receipt image capture for OCR scanning
 * Feature: Resibo Scanner (Build 3) + Sprint 16 native polish (Gap G4 mitigation)
 * Role: Client-side camera/file capture.
 *       - Web (Vercel PWA target): getUserMedia (rear camera) + file input fallback.
 *       - Native (Capacitor Android/iOS): @capacitor/camera single-shot Camera.getPhoto.
 *       The branching is gated by Capacitor.isNativePlatform() and happens at the
 *       "Kunan ng litrato" click handler. The component external API
 *       (onCapture(file), onCancel()) is unchanged — only the internal capture
 *       mechanism differs.
 *
 * Flow (web): idle -> camera-active -> previewing -> onCapture
 * Flow (native): idle -> previewing -> onCapture   (no camera-active intermediate;
 *                Camera.getPhoto is a modal OS sheet that returns or throws)
 *
 * Reference: akbai-delivery/skills/solutions-architect/references/sprint-16-native-plugin-pattern.md §2
 * Dependencies: @capacitor/core (platform detection), @capacitor/camera (native only)
 * Design: useRef + onClick (React 19 bug), 44px+ touch targets, design system tokens
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Check, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { SUPPORTED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/ocr/types';

// ============================================================
// Types
// ============================================================

interface CameraCaptureProps {
  /** Called when user confirms a captured/selected image */
  onCapture: (file: File) => void;
  /** Called when user cancels the capture flow */
  onCancel: () => void;
}

type CaptureState = 'idle' | 'camera-active' | 'previewing' | 'permission-denied' | 'no-camera';

// ============================================================
// Constants
// ============================================================

const ACCEPTED_TYPES = SUPPORTED_MIME_TYPES.join(',');

// --- Evaluate platform once at module load. Capacitor.isNativePlatform()
//     returns false in browser/JSDOM/Vercel; true inside the Capacitor WebView.
const isNative = Capacitor.isNativePlatform();

// ============================================================
// dataUrlToFile — bridges Camera.getPhoto's dataUrl into the File-typed
// contract that ScannerFlow.handleCapture expects.
// Exported for unit tests (the bridge is the load-bearing native logic).
// Reference: sprint-16-native-plugin-pattern.md §2 "Image format bridge".
// ============================================================

export async function dataUrlToFile(
  dataUrl: string,
  format: string
): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  return new File([blob], `resibo-${Date.now()}.${ext}`, { type: mimeType });
}

// ============================================================
// Error classification for native Camera.getPhoto throws.
// The plugin doesn't separate "user cancelled" vs "permission denied"
// cleanly across platforms — we sniff the message. Uses `unknown` +
// type guard (no `any`) per TypeScript strict policy.
// ============================================================

type NativeCameraErrorKind = 'cancelled' | 'permission-denied' | 'other';

function classifyNativeCameraError(err: unknown): NativeCameraErrorKind {
  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : typeof err === 'string'
      ? err.toLowerCase()
      : '';
  if (msg.includes('cancel') || msg.includes('user denied')) return 'cancelled';
  if (msg.includes('permission')) return 'permission-denied';
  return 'other';
}

// ============================================================
// Component
// ============================================================

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [state, setState] = useState<CaptureState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Refs (React 19 controlled input bug — no onChange/onSubmit) ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ============================================================
  // Cleanup: Stop camera stream on unmount or state change
  // ============================================================

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  // ============================================================
  // Bottom-nav suppression — while the live camera feed is active,
  // set body[data-scanning="true"] so globals.css hides the bottom
  // nav and the viewfinder owns the thumb zone. Cleared on every
  // transition out of camera-active and on unmount to guarantee
  // we never strand the nav hidden mid-flow.
  // ============================================================

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (state === 'camera-active') {
      document.body.dataset.scanning = 'true';
    } else {
      delete document.body.dataset.scanning;
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete document.body.dataset.scanning;
      }
    };
  }, [state]);

  // ============================================================
  // Camera Start — getUserMedia with rear camera preference
  // ============================================================

  const startCamera = useCallback(async () => {
    setError(null);

    // Check if getUserMedia is available
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('no-camera');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      streamRef.current = stream;
      setState('camera-active');

      // Attach stream to video element after state update
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err) {
      const typedErr = err as DOMException;
      if (typedErr.name === 'NotAllowedError' || typedErr.name === 'PermissionDeniedError') {
        setState('permission-denied');
      } else {
        setState('no-camera');
      }
    }
  }, []);

  // ============================================================
  // Native Camera — @capacitor/camera single-shot capture (Sprint 16).
  // Active only when Capacitor.isNativePlatform() === true. On web this
  // callback is wired but never invoked (the idle button below picks
  // startCamera instead). The plugin auto-prompts for OS camera permission
  // on first call; subsequent calls reuse. State flow on native collapses
  // to idle -> previewing (no 'camera-active' intermediate).
  // ============================================================

  const startNativeCamera = useCallback(async () => {
    setError(null);
    try {
      const photo = await CapacitorCamera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 85,
        width: 1600,
        saveToGallery: false,
      });

      if (!photo.dataUrl) {
        setError('Walang nakuhang larawan. Subukan muli.');
        return;
      }

      const file = await dataUrlToFile(photo.dataUrl, photo.format);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setCapturedFile(file);
      setState('previewing');
    } catch (err) {
      const kind = classifyNativeCameraError(err);
      if (kind === 'cancelled') {
        // User backed out of the OS modal — treat like idle (no error toast).
        setState('idle');
        return;
      }
      if (kind === 'permission-denied') {
        setState('permission-denied');
        return;
      }
      setError('Hindi makapag-bukas ang camera. Subukan muli.');
      setState('idle');
    }
  }, []);

  // --- Branch the "Kunan ng litrato" handler: native -> single-shot
  //     OS modal; web -> existing getUserMedia live-feed flow. ---
  const handleStartCamera = isNative ? startNativeCamera : startCamera;

  // ============================================================
  // Camera Capture — Snap frame from video to canvas -> File
  // ============================================================

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `resibo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        // Stop camera before preview
        stopCamera();

        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setCapturedFile(file);
        setState('previewing');
      },
      'image/jpeg',
      0.85
    );
  }, [stopCamera]);

  // ============================================================
  // File Upload — Gallery/file picker fallback
  // ============================================================

  const handleFileSelect = useCallback(() => {
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];

    // --- Validate MIME type ---
    if (!SUPPORTED_MIME_TYPES.includes(file.type as typeof SUPPORTED_MIME_TYPES[number])) {
      setError('JPEG, PNG, o WebP lang ang puwedeng i-upload.');
      return;
    }

    // --- Validate file size ---
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('Masyadong malaki ang image — under 10MB lang po.');
      return;
    }

    setError(null);
    stopCamera();

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCapturedFile(file);
    setState('previewing');
  }, [stopCamera]);

  // ============================================================
  // Preview Actions — Confirm or retake
  // ============================================================

  const handleConfirm = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  const handleRetake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCapturedFile(null);
    setError(null);
    setState('idle');
  }, [previewUrl]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col items-center" data-testid="camera-capture">
      {/* Hidden canvas for camera frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery upload (React 19: no onChange, use ref) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture="environment"
        className="hidden"
        data-testid="file-input"
      />

      {/* --- Idle State: Show action buttons --- */}
      {state === 'idle' && (
        <div className="w-full space-y-4">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <p className="text-on-surface font-semibold text-base mb-1">
              I-scan ang resibo mo
            </p>
            <p className="text-on-surface-variant text-sm mb-6">
              Kunan ng litrato o mag-upload mula sa gallery
            </p>

            <div className="flex flex-col gap-3">
              {/* Primary: Open camera (native -> single-shot OS modal,
                  web -> live getUserMedia feed; gated by handleStartCamera) */}
              <button
                type="button"
                onClick={handleStartCamera}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3 transition-opacity hover:opacity-90 active:scale-[0.98]"
                data-testid="open-camera-btn"
              >
                <Camera className="w-5 h-5" />
                Kunan ng litrato
              </button>

              {/* Secondary: File upload */}
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3 transition-opacity hover:opacity-90 active:scale-[0.98]"
                data-testid="upload-btn"
              >
                <Upload className="w-5 h-5" />
                Mag-upload ng larawan
              </button>
            </div>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full min-h-[44px] text-on-surface-variant font-medium text-sm"
            data-testid="cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}

      {/* --- Camera Active: full-bleed Warm Precision viewfinder ---
          warm near-black (scan-ink) full-bleed, honey corner brackets, an
          animated scan-sweep line, a glass control bar, and a 70px shutter.
          body[data-scanning="true"] (set by the effect above) hides the
          bottom nav so the viewfinder owns the thumb zone. --- */}
      {state === 'camera-active' && (
        <div
          className="fixed inset-0 z-40 bg-scan-ink flex flex-col"
          data-testid="camera-active"
        >
          {/* Viewfinder frame */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="camera-video"
            />

            {/* Honey corner brackets (aim guide) */}
            <span aria-hidden className="absolute top-[14%] left-[12%] w-9 h-9 border-[3px] border-r-0 border-b-0 border-honey-bright rounded-tl-md" />
            <span aria-hidden className="absolute top-[14%] right-[12%] w-9 h-9 border-[3px] border-l-0 border-b-0 border-honey-bright rounded-tr-md" />
            <span aria-hidden className="absolute bottom-[14%] left-[12%] w-9 h-9 border-[3px] border-r-0 border-t-0 border-honey-bright rounded-bl-md" />
            <span aria-hidden className="absolute bottom-[14%] right-[12%] w-9 h-9 border-[3px] border-l-0 border-t-0 border-honey-bright rounded-br-md" />

            {/* Animated honey scan-sweep line. Under prefers-reduced-motion the
                animation is killed AND the line is hidden (motion-reduce:hidden)
                so it doesn't sit as a static honey bar — matching the brackets. */}
            <span
              aria-hidden
              className="absolute left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-honey-bright to-transparent animate-scan-sweep motion-reduce:hidden"
              style={{ top: '18%', boxShadow: '0 0 12px hsl(var(--honey-bright))' }}
            />

            {/* Aim hint */}
            <p className="absolute bottom-4 inset-x-0 text-center text-[13px] font-semibold text-on-primary/85 px-4">
              I-frame ang resibo sa loob ng linya
            </p>
          </div>

          {/* Glass control bar — the second of the two permitted glass surfaces
              (the other is the bottom nav). Cancel · 70px shutter · spacer. */}
          <div className="relative flex items-center justify-center gap-10 px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <span aria-hidden className="absolute inset-0 bg-scan-ink/40 backdrop-blur-md ring-1 ring-inset ring-on-primary/10" />

            {/* Cancel camera */}
            <button
              type="button"
              onClick={() => { stopCamera(); setState('idle'); }}
              className="relative z-10 w-12 h-12 min-h-[44px] rounded-full flex items-center justify-center text-on-primary/90 hover:bg-on-primary/10 transition-colors"
              data-testid="camera-cancel-btn"
              aria-label="Isara ang camera"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Shutter — 70px ring + white core (.shutter) */}
            <button
              type="button"
              onClick={captureFrame}
              className="relative z-10 w-[70px] h-[70px] rounded-full border-4 border-on-primary/90 p-1 transition-transform active:scale-[0.92]"
              data-testid="capture-btn"
              aria-label="Kunan"
            >
              <span className="block w-full h-full rounded-full bg-on-primary" />
            </button>

            {/* Symmetry spacer so the shutter stays centered */}
            <span aria-hidden className="relative z-10 w-12 h-12" />
          </div>
        </div>
      )}

      {/* --- Preview State: Show captured image + confirm/retake --- */}
      {state === 'previewing' && previewUrl && (
        <div className="w-full space-y-4">
          <div className="relative bg-surface-container rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Na-capture na resibo"
              className="w-full rounded-2xl"
              data-testid="preview-image"
            />
          </div>

          <div className="flex gap-3">
            {/* Retake */}
            <button
              type="button"
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 flex-1 min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3"
              data-testid="retake-btn"
            >
              <RotateCcw className="w-4 h-4" />
              Kunan ulit
            </button>

            {/* Confirm */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex items-center justify-center gap-2 flex-[2] min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3"
              data-testid="confirm-btn"
            >
              <Check className="w-4 h-4" />
              Gamitin ito
            </button>
          </div>
        </div>
      )}

      {/* --- Permission Denied (architect §2 locked copy) --- */}
      {state === 'permission-denied' && (
        <div className="w-full space-y-4">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <Camera className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface font-semibold text-sm mb-1">
              Kailangan ng access sa camera
            </p>
            <p className="text-on-surface-variant text-xs mb-4">
              Para ma-scan natin ang resibo mo, i-allow mo muna ang camera sa Settings.
            </p>

            <button
              type="button"
              onClick={handleUploadClick}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3"
              data-testid="upload-fallback-btn"
            >
              <Upload className="w-5 h-5" />
              Mag-upload na lang ng larawan
            </button>
          </div>
        </div>
      )}

      {/* --- No Camera API Available --- */}
      {state === 'no-camera' && (
        <div className="w-full space-y-4">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <p className="text-on-surface font-semibold text-sm mb-1">
              Walang camera na available
            </p>
            <p className="text-on-surface-variant text-xs mb-4">
              Puwede ka namang mag-upload ng larawan ng resibo mo.
            </p>

            <button
              type="button"
              onClick={handleUploadClick}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-primary-container text-on-primary font-semibold rounded-xl py-3"
              data-testid="upload-no-camera-btn"
            >
              <Upload className="w-5 h-5" />
              Mag-upload ng larawan
            </button>
          </div>
        </div>
      )}

      {/* --- Error Message --- */}
      {error && (
        <div className="w-full mt-3 bg-error-container/30 rounded-lg p-3 text-center" data-testid="capture-error">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
