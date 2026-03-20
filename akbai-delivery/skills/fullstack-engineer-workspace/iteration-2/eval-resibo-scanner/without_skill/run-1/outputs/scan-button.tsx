'use client';

import { useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface ScanButtonProps {
  onScanSuccess: (receipt: any) => void;
}

export default function ScanButton({ onScanSuccess }: ScanButtonProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Hindi ma-access ang camera';
      setCameraError(errorMsg);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureAndUpload = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera hindi available');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Capture image from video stream
      const context = canvasRef.current.getContext('2d');
      if (!context) {
        throw new Error('Canvas context unavailable');
      }

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.85
        );
      });

      // Initialize Supabase
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

      // Upload image to Supabase Storage
      const timestamp = Date.now();
      const filename = `${authData.user.id}/${timestamp}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resibo-scans')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resibo-scans')
        .getPublicUrl(filename);

      // Call OCR API
      const response = await fetch('/api/resibo/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: uploadData.path,
          imageUrl: urlData.publicUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `OCR processing failed: ${response.statusText}`
        );
      }

      const receipt = await response.json();

      // Update UI
      onScanSuccess(receipt);
      setIsOpen(false);
      stopCamera();

      // Show success feedback
      alert('✅ Resibo na-scan successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error('Capture and upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Initialize Supabase
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

      // Upload file to Supabase Storage
      const timestamp = Date.now();
      const filename = `${authData.user.id}/${timestamp}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resibo-scans')
        .upload(filename, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resibo-scans')
        .getPublicUrl(filename);

      // Call OCR API
      const response = await fetch('/api/resibo/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: uploadData.path,
          imageUrl: urlData.publicUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `OCR processing failed: ${response.statusText}`
        );
      }

      const receipt = await response.json();

      // Update UI
      onScanSuccess(receipt);
      setIsOpen(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show success feedback
      alert('✅ Resibo na-upload successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setCameraError(null);
        }}
        disabled={isUploading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <span className="text-lg">📷</span>
        <span>{isUploading ? 'Nag-uupload...' : 'Mag-scan ng Resibo'}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Mag-scan ng Resibo</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              stopCamera();
              setError(null);
              setCameraError(null);
            }}
            className="text-slate-500 hover:text-slate-900 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Camera Section */}
        <div className="space-y-3">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              🎥 Buksan ang Camera
            </button>
          ) : (
            <>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-yellow-400 opacity-50 rounded-lg pointer-events-none" />
              </div>
              <button
                onClick={captureAndUpload}
                disabled={isUploading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                {isUploading ? '⏳ Nag-uupload...' : '✓ I-capture at I-upload'}
              </button>
              <button
                onClick={stopCamera}
                disabled={isUploading}
                className="w-full bg-slate-300 hover:bg-slate-400 disabled:bg-slate-400 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Isara ang Camera
              </button>
            </>
          )}
        </div>

        {/* File Upload Option */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            O piliin ang file mula sa iyong device:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading || isCameraActive}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Error Messages */}
        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Camera Error: </span>
              {cameraError}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <span className="font-semibold">Error: </span>
              {error}
            </p>
          </div>
        )}

        {/* Canvas (hidden) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
