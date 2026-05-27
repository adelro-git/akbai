import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'fs';
import path from 'path';

/**
 * Pre-Launch Gate (Sprint 19 Phase A): the shipped Android binaries must
 * stay under 30 MB so a Filipino MSME on a tight mobile-data plan can
 * install AKBai over LTE without burning through their load.
 *
 * This guard runs against the most recently produced gradle debug output.
 * It skips gracefully when the binaries are absent (CI without an Android
 * toolchain, or a fresh checkout pre-`./gradlew bundleDebug`).
 *
 * Re-baseline if either ceiling is raised:
 *   - `akbai-delivery/shared/project-context.md` Pre-Launch Gate row
 *   - sprint-history entry that justifies the change
 */
const AAB_PATH = path.resolve(
  __dirname,
  '../../../android/app/build/outputs/bundle/debug/app-debug.aab'
);
const APK_PATH = path.resolve(
  __dirname,
  '../../../android/app/build/outputs/apk/debug/app-debug.apk'
);

const PRE_LAUNCH_GATE_MAX_MB = 30;

describe('Bundle size guard (Pre-Launch Gate <30 MB)', () => {
  it('.aab is under 30 MB if it exists', () => {
    if (!existsSync(AAB_PATH)) {
      // Gracefully skip — CI / local dev without Android toolchain.
      // Run `./gradlew bundleDebug` in frontend/android/ to produce the artifact.
      console.warn(`[bundle-size-guard] .aab not found at ${AAB_PATH}; skipping`);
      return;
    }
    const sizeMB = statSync(AAB_PATH).size / 1024 / 1024;
    expect(sizeMB).toBeLessThan(PRE_LAUNCH_GATE_MAX_MB);
  });

  it('.apk is under 30 MB if it exists', () => {
    if (!existsSync(APK_PATH)) {
      // Gracefully skip — CI / local dev without Android toolchain.
      // Run `./gradlew assembleDebug` in frontend/android/ to produce the artifact.
      console.warn(`[bundle-size-guard] .apk not found at ${APK_PATH}; skipping`);
      return;
    }
    const sizeMB = statSync(APK_PATH).size / 1024 / 1024;
    expect(sizeMB).toBeLessThan(PRE_LAUNCH_GATE_MAX_MB);
  });
});
