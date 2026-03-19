/**
 * Resibo Scanner — Scan Button Component
 * Feature: Resibo Scanner (Build 3)
 * Route: /components/features/resibo/scan-button.tsx
 *
 * Role: Client-side camera capture, image compression, and upload to Supabase Storage
 *
 * Flow: User tap → request camera permission → capture frame as JPEG
 *       → compress image → upload to Supabase Storage (receipts bucket)
 *       → call POST /api/resibo/scan with storage path
 *       → display OCR results or error
 *
 * Dependencies: Supabase Storage (receipts bucket), /api/resibo/scan endpoint,
 *               browser Camera API (getUserMedia)
 * Tested by: QA — camera permission flow, image compression, upload error handling,
 *            API call retry logic, success/error state display
 */

'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ScanButtonProps {
  userId: string;
}

/**
 * State machine for the scan button UX
 * idle: ready to scan
 * capturing: camera stream active
 * uploading: image being sent to Storage
 * processing: API call to /api/resibo/scan in progress
 * success: scan completed, receipt card displayed (managed by parent)
 * error: something went wrong
 */
type ScanState = 'idle' | 'capturing' | 'uploading' | 'processing' | 'error';

export function ScanButton({ userId }: ScanButtonProps) {
  const [state, setState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Camera Permission: Request access to device camera ---
  const requestCameraAccess = async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      return stream;
    } catch (error) {
      const err = error as Error;
      console.error('Camera access error:', err.message);
      setErrorMessage('Hindi ma-access ang camera. Check ang permissions.');
      setState('error');
      return null;
    }
  };

  // --- Camera Stream: Play video from camera on canvas ---
  const startCamera = async (stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      return new Promise<void>((resolve) => {
        videoRef.current!.onloadedmetadata = () => {
          videoRef.current!.play();
          resolve();
        };
      });
    }
  };

  // --- Image Capture: Extract frame from video, compress to JPEG ---
  const captureFrame = (): Blob | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const context = canvasRef.current.getContext('2d');
    if (!context) return null;

    // Set canvas dimensions to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(videoRef.current, 0, 0);

    // Convert to JPEG blob with compression (0.7 = 70% quality)
    let imageBlob: Blob | null = null;
    canvasRef.current.toBlob(
      (blob) => {
        imageBlob = blob;
      },
      'image/jpeg',
      0.7
    );

    return imageBlob;
  };

  // --- Stream Cleanup: Release camera and stop video playback ---
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // --- Storage Upload: Send compressed image to Supabase Storage ---
  const uploadToStorage = async (imageBlob: Blob): Promise<string | null> => {
    try {
      const supabase = createClient();
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const uniqueId = crypto.randomUUID();

      // Build storage path: {userId}/{year}/{month}/{uuid}.jpg
      const storagePath = `${userId}/${year}/${month}/${uniqueId}.jpg`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(storagePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error.message);
        setErrorMessage('May problema sa pag-upload. Subukan ulit.');
        setState('error');
        return null;
      }

      return storagePath;
    } catch (error) {
      const err = error as Error;
      console.error('Unexpected upload error:', err.message);
      setErrorMessage('May problema sa pag-upload. Subukan ulit.');
      setState('error');
      return null;
    }
  };

  // --- Claude API Call: Send storage path to /api/resibo/scan for OCR ---
  const callScanAPI = async (storagePath: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/resibo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message_tl?: string };
        };
        setErrorMessage(
          errorData.error?.message_tl ||
            'May problema sa pag-scan. Subukan ulit.'
        );
        setState('error');
        return false;
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Scan API error:', err.message);
      setErrorMessage('May problema sa pag-scan. Subukan ulit.');
      setState('error');
      return false;
    }
  };

  // --- Main Handler: Orchestrate camera capture → upload → scan ---
  const handleScan = async () => {
    setState('idle');
    setErrorMessage('');

    // Request camera access
    setState('capturing');
    const stream = await requestCameraAccess();
    if (!stream) return;

    try {
      await startCamera(stream);

      // Show camera for 1.5 seconds before capturing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Capture frame from live video
      const imageBlob = captureFrame();
      if (!imageBlob) {
        setErrorMessage('May problema sa pag-capture. Subukan ulit.');
        setState('error');
        return;
      }

      // Upload to Supabase Storage
      setState('uploading');
      const storagePath = await uploadToStorage(imageBlob);
      if (!storagePath) return;

      // Call Claude OCR API
      setState('processing');
      const success = await callScanAPI(storagePath);

      if (success) {
        setState('idle');
        // Page will revalidate to show new receipt card
        // In production, trigger parent to refresh receipt list
      }
    } finally {
      stopCamera();
    }
  };

  // --- Render: Button with loading state ---
  const getButtonText = () => {
    switch (state) {
      case 'capturing':
        return 'Kumukuha ng screenshot...';
      case 'uploading':
        return 'Nag-uupload...';
      case 'processing':
        return 'Nag-a-analyze...';
      case 'error':
        return 'May Problema';
      default:
        return 'I-scan ang Resibo';
    }
  };

  const isDisabled = state !== 'idle' && state !== 'error';

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleScan}
        disabled={isDisabled}
        className="min-h-touch w-full rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
                   px-4 py-3 font-semibold text-ink transition-all disabled:opacity-60"
      >
        {getButtonText()}
      </button>

      {/* Hidden video and canvas for camera capture */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Error message display */}
      {state === 'error' && errorMessage && (
        <div className="rounded-lg bg-red-900/20 px-3 py-2 text-sm text-red-400">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
