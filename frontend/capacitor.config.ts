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
  plugins: {
    // --------------------------------------------------------
    // Sprint 18 (resilience §11) — Splash screen.
    // The Android splash PNGs already exist in the native project;
    // this block wires the @capacitor/splash-screen plugin behaviour.
    // NOTE: @capacitor/splash-screen is NOT yet in package.json — this
    // config is INERT until that package is installed + synced (PM to
    // add the dependency). Core Capacitor does NOT honour these keys on
    // its own; they require the SplashScreen plugin to be present.
    // backgroundColor matches the brand light surface (#fdf9f2). A
    // literal hex is correct here — this is native plugin config, not a
    // web component, so Tailwind tokens do not apply.
    // --------------------------------------------------------
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fdf9f2',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#fdf9f2',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
