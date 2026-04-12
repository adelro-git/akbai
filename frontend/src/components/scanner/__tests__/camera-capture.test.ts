// ============================================================
// Camera Capture Tests — Build 3: Resibo Scanner
// Feature: Receipt image capture via camera/file upload
//
// Tests: file validation (MIME types, size), capture state logic,
//        accepted file types, permission states.
// Vitest node environment — tests logic and configuration, not DOM.
// ============================================================

import { describe, it, expect } from 'vitest';
import { SUPPORTED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from '@/lib/ocr/types';

// ============================================================
// File Validation Logic (mirrors camera-capture.tsx validation)
// ============================================================

function isValidMimeType(type: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(type as typeof SUPPORTED_MIME_TYPES[number]);
}

function isValidFileSize(size: number): boolean {
  return size <= MAX_IMAGE_SIZE_BYTES;
}

// ============================================================
// Capture State Machine (mirrors component states)
// ============================================================

type CaptureState = 'idle' | 'camera-active' | 'previewing' | 'permission-denied' | 'no-camera';

interface StateTransition {
  from: CaptureState;
  action: string;
  to: CaptureState;
}

const VALID_TRANSITIONS: StateTransition[] = [
  { from: 'idle', action: 'start-camera', to: 'camera-active' },
  { from: 'idle', action: 'select-file', to: 'previewing' },
  { from: 'idle', action: 'camera-denied', to: 'permission-denied' },
  { from: 'idle', action: 'no-camera-api', to: 'no-camera' },
  { from: 'camera-active', action: 'capture-frame', to: 'previewing' },
  { from: 'camera-active', action: 'cancel', to: 'idle' },
  { from: 'previewing', action: 'retake', to: 'idle' },
  { from: 'previewing', action: 'confirm', to: 'idle' }, // exits component via onCapture
  { from: 'permission-denied', action: 'upload-fallback', to: 'previewing' },
  { from: 'no-camera', action: 'upload-fallback', to: 'previewing' },
];

function canTransition(from: CaptureState, action: string): CaptureState | null {
  const match = VALID_TRANSITIONS.find((t) => t.from === from && t.action === action);
  return match?.to ?? null;
}

// ============================================================
// Tests
// ============================================================

describe('CameraCapture — file validation', () => {
  // --- Test 1: Accepts valid MIME types ---
  it('accepts JPEG, PNG, and WebP file types', () => {
    expect(isValidMimeType('image/jpeg')).toBe(true);
    expect(isValidMimeType('image/png')).toBe(true);
    expect(isValidMimeType('image/webp')).toBe(true);
  });

  // --- Test 2: Rejects invalid MIME types ---
  it('rejects unsupported file types', () => {
    expect(isValidMimeType('image/gif')).toBe(false);
    expect(isValidMimeType('image/bmp')).toBe(false);
    expect(isValidMimeType('application/pdf')).toBe(false);
    expect(isValidMimeType('text/plain')).toBe(false);
  });

  // --- Test 3: Validates file size within 10MB limit ---
  it('accepts files under 10MB and rejects files over 10MB', () => {
    expect(isValidFileSize(5 * 1024 * 1024)).toBe(true);    // 5MB
    expect(isValidFileSize(10 * 1024 * 1024)).toBe(true);    // exactly 10MB
    expect(isValidFileSize(10 * 1024 * 1024 + 1)).toBe(false); // 10MB + 1 byte
    expect(isValidFileSize(20 * 1024 * 1024)).toBe(false);   // 20MB
  });
});

describe('CameraCapture — state machine', () => {
  // --- Test 4: Idle state transitions correctly ---
  it('transitions from idle to camera-active, previewing, or permission-denied', () => {
    expect(canTransition('idle', 'start-camera')).toBe('camera-active');
    expect(canTransition('idle', 'select-file')).toBe('previewing');
    expect(canTransition('idle', 'camera-denied')).toBe('permission-denied');
    expect(canTransition('idle', 'no-camera-api')).toBe('no-camera');
  });

  // --- Test 5: Camera active transitions correctly ---
  it('transitions from camera-active to previewing on capture or idle on cancel', () => {
    expect(canTransition('camera-active', 'capture-frame')).toBe('previewing');
    expect(canTransition('camera-active', 'cancel')).toBe('idle');
  });

  // --- Test 6: Preview state transitions correctly ---
  it('transitions from previewing to idle on retake or confirm', () => {
    expect(canTransition('previewing', 'retake')).toBe('idle');
    expect(canTransition('previewing', 'confirm')).toBe('idle');
  });

  // --- Test 7: Permission denied allows upload fallback ---
  it('allows upload fallback from permission-denied and no-camera states', () => {
    expect(canTransition('permission-denied', 'upload-fallback')).toBe('previewing');
    expect(canTransition('no-camera', 'upload-fallback')).toBe('previewing');
  });

  // --- Test 8: Invalid transitions return null ---
  it('returns null for invalid state transitions', () => {
    expect(canTransition('idle', 'capture-frame')).toBeNull();
    expect(canTransition('previewing', 'start-camera')).toBeNull();
    expect(canTransition('camera-active', 'select-file')).toBeNull();
  });
});
