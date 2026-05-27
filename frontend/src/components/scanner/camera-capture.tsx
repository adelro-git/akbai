'use client';

/**
 * Camera Capture — Receipt image capture for OCR scanning
 * Feature: Resibo Scanner (Build 3)
 * Role: Client-side camera/file capture. Primary: getUserMedia (rear camera).
 *       Fallback: file input for gallery upload.
 *
 * Flow: Camera feed / file select -> preview captured image -> confirm or retake
 *
 * Dependencies: None (standalone capture component)
 * Design: useRef + onClick (React 19 bug), 44px+ touch targets, design system tokens
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Check, X } from 'lucide-react';
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
              {/* Primary: Open camera */}
              <button
                type="button"
                onClick={startCamera}
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

      {/* --- Camera Active: Live video feed --- */}
      {state === 'camera-active' && (
        <div className="w-full space-y-4">
          <div className="relative bg-on-surface rounded-2xl overflow-hidden aspect-[3/4]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="camera-video"
            />
          </div>

          <div className="flex gap-3">
            {/* Cancel camera */}
            <button
              type="button"
              onClick={() => { stopCamera(); setState('idle'); }}
              className="flex-1 min-h-[44px] bg-surface-container-high text-on-surface font-semibold rounded-xl py-3"
              data-testid="camera-cancel-btn"
            >
              <X className="w-5 h-5 mx-auto" />
            </button>

            {/* Capture button — large, prominent */}
            <button
              type="button"
              onClick={captureFrame}
              className="flex-[2] min-h-[56px] bg-primary-container text-on-primary font-bold rounded-xl py-3 text-lg transition-transform active:scale-95"
              data-testid="capture-btn"
            >
              Kunan
            </button>
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

      {/* --- Permission Denied --- */}
      {state === 'permission-denied' && (
        <div className="w-full space-y-4">
          <div className="bg-surface-container-low rounded-2xl p-6 text-center">
            <Camera className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
            <p className="text-on-surface font-semibold text-sm mb-1">
              Kailangan ko ng camera access
            </p>
            <p className="text-on-surface-variant text-xs mb-4">
              Para ma-scan ko ang resibo mo, i-enable mo ang camera sa Settings.
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
