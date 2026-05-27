import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akbai.app',
  appName: 'AKBai',
  webDir: 'out',
  // ----------------------------------------------------------
  // Sprint 16 — deep linking (architect §5).
  // The Android intent-filter for `com.akbai.app://auth/callback` is
  // declared directly in `android/app/src/main/AndroidManifest.xml`
  // (Capacitor's config object doesn't accept intentFilters on the
  // android adapter — see Capacitor docs §Android Configuration).
  // iOS CFBundleURLTypes equivalent is documented in the architect
  // doc for Sprint 17/19 iOS work (iOS scaffold doesn't exist yet).
  // ----------------------------------------------------------
};

export default config;
