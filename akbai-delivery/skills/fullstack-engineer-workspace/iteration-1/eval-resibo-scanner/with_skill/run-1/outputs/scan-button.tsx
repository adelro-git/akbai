'use client';

import { useState, useRef } from 'react';

interface ScanButtonProps {
  userId: string;
}

export function ScanButton({ userId }: ScanButtonProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleOpenCamera = async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'May problema sa camera access';
      setError(`Hindi ma-open ang camera: ${message}`);
      setIsScanning(false);
    }
  };

  const handleCapturePhoto = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!videoRef.current || !canvasRef.current) {
      setError('May problema sa camera setup');
      return;
    }

    try {
      setIsScanning(true);

      // Capture frame from video
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context failed');
      }

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          setError('Mali sa pag-capture ng larawan');
          setIsScanning(false);
          return;
        }

        try {
          // Create FormData with the image
          const formData = new FormData();
          formData.append('image', blob, 'receipt.jpg');
          formData.append('userId', userId);

          // Upload to Supabase Storage and process
          const response = await fetch('/api/resibo/scan', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (!response.ok) {
            const errorMsg = result.error?.message_tl || 'May problema sa pag-scan ng resibo';
            setError(errorMsg);
            setIsScanning(false);
            return;
          }

          setSuccessMessage('Na-scan ang resibo! Check mo sa listahan sa baba.');

          // Close camera and reset
          stopCamera();
          setIsCameraOpen(false);

          // Reload page to show new receipt
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Network error';
          setError(`Error sa pag-upload: ${message}`);
          setIsScanning(false);
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Mali sa pag-capture: ${message}`);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    try {
      setIsScanning(true);

      // Create FormData with the file
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', userId);

      // Upload to Supabase Storage and process
      const response = await fetch('/api/resibo/scan', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error?.message_tl || 'May problema sa pag-scan ng resibo';
        setError(errorMsg);
        setIsScanning(false);
        return;
      }

      setSuccessMessage('Na-scan ang resibo! Check mo sa listahan sa baba.');

      // Reset input and reload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(`Error sa pag-upload: ${message}`);
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Camera View */}
      {isCameraOpen && (
        <div className="rounded-xl bg-card p-4 flex flex-col gap-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black aspect-video object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <button
              onClick={handleCapturePhoto}
              disabled={isScanning}
              className="flex-1 min-h-[44px] rounded-lg bg-gradient-to-r from-teal-light to-teal-cyan
                         font-semibold text-white disabled:opacity-50 transition-opacity"
            >
              {isScanning ? 'Nag-i-scan...' : 'I-capture ang Larawan'}
            </button>
            <button
              onClick={handleCloseCamera}
              disabled={isScanning}
              className="flex-1 min-h-[44px] rounded-lg bg-card border border-gray-600
                         font-semibold text-white disabled:opacity-50 transition-opacity"
            >
              Ikot
            </button>
          </div>
        </div>
      )}

      {/* Button Group */}
      {!isCameraOpen && (
        <div className="flex gap-3">
          <button
            onClick={handleOpenCamera}
            disabled={isScanning}
            className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
                       font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            📷 I-scan gamit ang Kamera
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-honey-light to-honey-deep
                       font-semibold text-white disabled:opacity-50 transition-opacity"
          >
            🖼️ Pumili ng Larawan
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select receipt image"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-teal-light/20 border border-teal-light/50 p-3">
          <p className="text-sm text-teal-light">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
