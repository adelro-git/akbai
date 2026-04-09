/**
 * PWA Manifest & Offline Page — Unit Tests
 * Feature: PWA Hardening (Sprint 5)
 * Tests: manifest.json correctness, offline page content
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ============================================================
// Load manifest.json from public directory
// ============================================================

// Resolve relative to the project root using process.cwd() (vitest runs from frontend/)
const manifestPath = join(process.cwd(), 'public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// ============================================================
// Manifest Tests
// ============================================================

describe('manifest.json', () => {
  it('has start_url set to /dashboard', () => {
    expect(manifest.start_url).toBe('/dashboard');
  });

  it('has id field', () => {
    expect(manifest.id).toBe('/');
  });

  it('has split icon purposes (separate any and maskable entries)', () => {
    const icons = manifest.icons as Array<{ purpose: string; sizes: string }>;

    // Should have 4 entries: 192 any, 192 maskable, 512 any, 512 maskable
    expect(icons.length).toBe(4);

    const icon192Any = icons.find(
      (i) => i.sizes === '192x192' && i.purpose === 'any'
    );
    const icon192Maskable = icons.find(
      (i) => i.sizes === '192x192' && i.purpose === 'maskable'
    );
    const icon512Any = icons.find(
      (i) => i.sizes === '512x512' && i.purpose === 'any'
    );
    const icon512Maskable = icons.find(
      (i) => i.sizes === '512x512' && i.purpose === 'maskable'
    );

    expect(icon192Any).toBeDefined();
    expect(icon192Maskable).toBeDefined();
    expect(icon512Any).toBeDefined();
    expect(icon512Maskable).toBeDefined();

    // No combined "any maskable" entries
    const combined = icons.filter((i) => i.purpose === 'any maskable');
    expect(combined).toHaveLength(0);
  });

  it('has shortcuts array with Dashboard, Chat, and Scan', () => {
    const shortcuts = manifest.shortcuts as Array<{ name: string; url: string }>;
    expect(shortcuts).toBeDefined();
    expect(shortcuts.length).toBe(3);

    const names = shortcuts.map((s) => s.name);
    expect(names).toContain('Dashboard');
    expect(names).toContain('Chat');
    expect(names).toContain('Scan');

    const urls = shortcuts.map((s) => s.url);
    expect(urls).toContain('/dashboard');
    expect(urls).toContain('/chat');
    expect(urls).toContain('/scan');
  });

  it('preserves existing fields (name, theme_color, etc.)', () => {
    expect(manifest.name).toBe('AKBai — Katuwang ng Negosyo Mo');
    expect(manifest.short_name).toBe('AKBai');
    expect(manifest.theme_color).toBe('#fdf9f2');
    expect(manifest.background_color).toBe('#fdf9f2');
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('tl');
  });
});

// ============================================================
// Offline Page Tests — verify the source file contains expected content
// ============================================================

describe('offline page', () => {
  const pagePath = join(__dirname, '..', 'page.tsx');
  const pageSource = readFileSync(pagePath, 'utf-8');

  it('renders with expected conversational Filipino message', () => {
    expect(pageSource).toContain('Walang internet connection');
    expect(pageSource).toContain(
      'I-check ang WiFi o data mo, tapos i-refresh.'
    );
  });

  it('has a retry button', () => {
    // The page imports RetryButton
    expect(pageSource).toContain('RetryButton');

    // The retry button component calls reload
    const buttonPath = join(__dirname, '..', 'retry-button.tsx');
    const buttonSource = readFileSync(buttonPath, 'utf-8');
    expect(buttonSource).toContain('window.location.reload()');
    expect(buttonSource).toContain('I-refresh');
  });

  it('exports metadata with correct title', () => {
    expect(pageSource).toContain("title: 'Offline — AKBai'");
  });
});
