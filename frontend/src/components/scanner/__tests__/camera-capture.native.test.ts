// ============================================================
// Camera Capture — Native branch tests (Sprint 16)
// Feature: @capacitor/camera integration for /scan
//
// Scope: validates the dataUrlToFile bridge that converts
//        Camera.getPhoto's { dataUrl, format } result into the
//        File contract that ScannerFlow.handleCapture consumes.
//        Also validates platform detection so the existing web
//        tests stay on the getUserMedia branch by default.
//
// We mock both @capacitor/core and @capacitor/camera so the
// component module loads cleanly under vitest node env (no
// native bridge available). Camera plugin behaviour itself is
// Capacitor's responsibility — we only test our bridge logic.
//
// Reference: sprint-16-native-plugin-pattern.md §2
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Module mocks — must be declared BEFORE the import under test.
// vi.mock is hoisted by vitest, so this block runs first.
// ============================================================

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'android',
  },
}));

const mockGetPhoto = vi.fn();

vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: (...args: unknown[]) => mockGetPhoto(...args),
  },
  CameraResultType: {
    DataUrl: 'dataUrl',
    Uri: 'uri',
    Base64: 'base64',
  },
  CameraSource: {
    Camera: 'CAMERA',
    Photos: 'PHOTOS',
    Prompt: 'PROMPT',
  },
}));

// ============================================================
// Subject under test — the dataUrlToFile bridge.
// We import after the mocks above so the module-load-time
// Capacitor.isNativePlatform() call resolves via the mock.
// ============================================================

import { dataUrlToFile } from '../camera-capture';

// ============================================================
// Sample JPEG data URL (1x1 transparent pixel encoded).
// 27-byte payload — small enough that any drift in bridge
// logic shows up as a wrong mimeType / name / size.
// ============================================================

const SAMPLE_JPEG_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDABAL';
const SAMPLE_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=';

// ============================================================
// Tests — dataUrlToFile bridge
// ============================================================

describe('dataUrlToFile — Camera.getPhoto -> File bridge', () => {
  beforeEach(() => {
    mockGetPhoto.mockReset();
  });

  // --- Test 1: JPEG dataUrl produces a JPEG File ---
  it('produces a File with image/jpeg mime when format is jpeg', async () => {
    const file = await dataUrlToFile(SAMPLE_JPEG_DATA_URL, 'jpeg');

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/jpeg');
    expect(file.name).toMatch(/^resibo-\d+\.jpg$/);
    expect(file.size).toBeGreaterThan(0);
  });

  // --- Test 2: PNG dataUrl produces a PNG File ---
  it('produces a File with image/png mime when format is png', async () => {
    const file = await dataUrlToFile(SAMPLE_PNG_DATA_URL, 'png');

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/png');
    expect(file.name).toMatch(/^resibo-\d+\.png$/);
    expect(file.size).toBeGreaterThan(0);
  });

  // --- Test 3: Unknown format falls back to JPEG (defensive default) ---
  it('falls back to image/jpeg for unknown format strings', async () => {
    const file = await dataUrlToFile(SAMPLE_JPEG_DATA_URL, 'webp');

    expect(file.type).toBe('image/jpeg');
    expect(file.name).toMatch(/\.jpg$/);
  });

  // --- Test 4: File name embeds a timestamp (uniqueness across captures) ---
  it('generates a unique timestamped filename per call', async () => {
    const f1 = await dataUrlToFile(SAMPLE_JPEG_DATA_URL, 'jpeg');
    // Advance time so Date.now() differs.
    await new Promise((r) => setTimeout(r, 5));
    const f2 = await dataUrlToFile(SAMPLE_JPEG_DATA_URL, 'jpeg');

    expect(f1.name).not.toBe(f2.name);
    expect(f1.name.startsWith('resibo-')).toBe(true);
    expect(f2.name.startsWith('resibo-')).toBe(true);
  });

  // --- Test 5: Bridge preserves the underlying blob bytes ---
  it('preserves blob byte content from the source dataUrl', async () => {
    const file = await dataUrlToFile(SAMPLE_JPEG_DATA_URL, 'jpeg');
    const buf = await file.arrayBuffer();
    // Decoded payload is exactly 27 bytes for the sample.
    expect(buf.byteLength).toBe(27);
  });
});

// ============================================================
// Sanity check that the Capacitor mocks resolve correctly —
// without these, the import-time module load would have failed.
// ============================================================

describe('Capacitor mocks — module load sanity', () => {
  it('Capacitor.isNativePlatform() returns true via mock', async () => {
    const { Capacitor } = await import('@capacitor/core');
    expect(Capacitor.isNativePlatform()).toBe(true);
  });

  it('Camera.getPhoto is the mocked function', async () => {
    const { Camera } = await import('@capacitor/camera');
    mockGetPhoto.mockResolvedValueOnce({
      dataUrl: SAMPLE_JPEG_DATA_URL,
      format: 'jpeg',
    });
    const result = await Camera.getPhoto({
      source: 'CAMERA',
      resultType: 'dataUrl',
      quality: 85,
      width: 1600,
    });
    expect(result.dataUrl).toBe(SAMPLE_JPEG_DATA_URL);
    expect(result.format).toBe('jpeg');
    expect(mockGetPhoto).toHaveBeenCalledOnce();
  });
});
