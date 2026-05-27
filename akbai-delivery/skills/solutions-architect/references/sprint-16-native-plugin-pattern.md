# Sprint 16 — Native Plugin Integration Pattern

**Status:** Locked 2026-05-27 by build-architect. Reference for `feat/16-native-polish`.
**Source of truth:** ADR-019 (Accepted Green — Sprint 15 close-out 2026-05-27) + Sprint 15 retro action items + this doc.
**Audience:** build-engineer (3 sequential batches per §9) + build-data (2 migrations per §8). Read this end-to-end before touching code. Every plugin follows the same web-fallback gating pattern; deviate only with an updated ADR.

---

## 0. Open Questions for Anton (flagged at PR review, do NOT block engineer)

These are decisions where two paths are genuinely reasonable. Engineer ships my recommendation; Anton overrides at PR review if he prefers the alternative. None of these block batch 1 from starting.

1. **Push subscription schema shape — extend `push_subscriptions` (alter) vs new `native_push_subscriptions` table.** Today `push_subscriptions` (migration `018_push_notifications.sql`) holds Web Push VAPID rows: `endpoint TEXT`, `p256dh_key TEXT`, `auth_key TEXT`, all `NOT NULL`. Native registrations have a *different* shape — a single FCM/APNs token, no VAPID keys. Two paths:
   - **(a) Recommendation: alter `push_subscriptions`** — add `platform TEXT NOT NULL DEFAULT 'web'` (`'web' | 'android' | 'ios'`) + relax `p256dh_key` and `auth_key` to nullable + add `native_token TEXT NULL` + add `device_id TEXT NULL` (for multi-device user disambiguation). One table, one set of RLS policies, one indexed unique constraint (now `(user_id, platform, COALESCE(native_token, endpoint))` instead of `(user_id, endpoint)`). `lib/push/send.ts` branches on `platform`: web rows → `webpush.sendNotification`, native rows → Firebase Admin SDK call (Sprint 19 work; Sprint 16 just persists the rows).
   - (b) Alternative: new `native_push_subscriptions` table with `native_token TEXT NOT NULL`, `platform TEXT NOT NULL`, `device_id TEXT`, no VAPID columns. Cleaner read-side but doubles the send-side fanout logic and the RLS surface.
   - **Why (a):** matches the pattern Supabase docs use for multi-platform push, keeps the single `notification_preferences` join cheap, and the column relaxation is reversible (rollback drops `platform`/`native_token`/`device_id` and re-NOT-NULLs the VAPID keys after web-only rows are confirmed). Build-data writes the migration per §8.

2. **Push permission deferred-prompt trigger.** Apple Guideline 4.5.4 + Google Play policy both reject apps that prompt for push on first launch without context. Web Push existed but never had a contextual gate either — `lib/push/register.ts` just calls `Notification.requestPermission()` when invoked. For Sprint 16, native plugin needs an explicit deferred trigger. Three reasonable options:
   - (a) **Recommendation: trigger from the `/deadlines` page when the user first views ANY upcoming BIR deadline within 14 days** (the natural "I might forget this" moment). Hook: add a one-shot localStorage flag `akbai_push_prompted_at` + check on `/deadlines` mount. Existing instrumentation: `getUpcomingNotifications()` in `lib/deadlines/notifications.ts` already produces the relevant signal client-side via the deadlines route.
   - (b) After 3rd `/dashboard` mount tracked in localStorage (`akbai_dashboard_views`). No existing counter; engineer adds it.
   - (c) Persistent in-app banner on `/profile` only — user must opt in explicitly. Lowest conversion, highest consent quality.
   - **Why (a):** there is an existing instrumented surface (the deadlines list itself), and the *reason* for the permission ("para hindi mo malampasan ang deadlines") matches the moment the user is staring at deadlines. Conversion will beat (b), consent quality beats Sprint 14's silent first-launch ask.

3. **Biometric onboarding step placement — step 6 in `OnboardingWizard` vs post-onboarding setup tile.** Today `OnboardingWizard` has steps 1-5 + a celebrate (`6`) + PWA install (`6.5`) interstitial. The cleanest insertion is a new step `6.25` between celebrate and PWA-install (`6.5`), titled "I-secure mo ang AKBai mo". Two paths:
   - **(a) Recommendation: step 6.25** — biometric prompt sits inside the onboarding flow but AFTER `trackOnboardingCompleted()` fires, so we don't gate completion on a permission. Skip button persists.
   - (b) Defer to a `/profile` setup tile + post-onboarding modal on 2nd app open. Lower friction at onboarding, but Apple reviewers won't see biometric unless they re-open the app — which they often don't during the 5-min review.
   - **Why (a):** Apple reviewer pass-through is the load-bearing reason biometric exists this sprint (G4 mitigation). A reviewer who never enables biometric never sees the API call we need them to observe. Visible-in-onboarding is the safer reviewer signal.

4. **`@sentry/capacitor` DSN — share with `@sentry/nextjs` or new project?** Today `@sentry/nextjs` ships JS errors from the WebView (same DSN, web SDK). `@sentry/capacitor` adds a native SDK that captures Java/Swift crashes outside the WebView. **Recommendation: same DSN, same project, different SDK init.** Sentry handles SDK disambiguation via the `sdk` field on the event envelope; the dashboard merges errors but a saved-search `sdk.name:sentry.javascript.nextjs` vs `sdk.name:sentry.capacitor` separates them. If Anton wants discrete projects (e.g., `akbai-web` vs `akbai-native`), say so at PR review — it's a one-line env-var change.

5. **Onboarding step-6.25 visibility on web (PWA fallback).** Biometric is native-only — there's no Web Authentication path in scope for Sprint 16. **Recommendation: skip step 6.25 entirely on web** via `Capacitor.isNativePlatform()` check; web users go straight from celebrate → PWA install. No conversational copy degradation, no "this feature isn't available" dead-end UI.

---

## 1. Top-5 risks engineer must internalise

1. **Capacitor plugin web-fallback gating.** Every native plugin (`@capacitor/camera`, `@capacitor/push-notifications`, `@capacitor-community/biometric-auth`) throws on web because the underlying Java/Swift bridge isn't there. The web build (Vercel target, no `CAPACITOR_BUILD=1`) **must continue to work** because the PWA is still the fallback distribution surface (per ADR-019 §Negative). **Mitigation:** every plugin call sits behind `if (Capacitor.isNativePlatform()) { … } else { /* web fallback */ }`. Import `Capacitor` from `@capacitor/core` (not from the plugin packages — those crash on `import` on some plugins). The camera flow already has a usable web fallback (`getUserMedia` + file input); push and biometric on web are no-ops (push uses the existing VAPID Web Push path; biometric is skipped entirely with a polite skip-step).

2. **FCM `google-services.json` placeholder ships without real credentials.** Sprint 16 wires the plugin scaffolding + the conditional Firebase init, but the real `google-services.json` is per-project Anton work in Sprint 19 (Firebase Console creation, package-name registration, server key download). **Engineer must NOT commit a real `google-services.json` to main.** Ship a placeholder file at `frontend/android/app/google-services.json` containing structural fields with TODO sentinels (see §3 for exact shape), plus an entry in `frontend/android/app/.gitignore` overriding the placeholder when a real one is dropped locally. The placeholder must let the Gradle build succeed (the `com.google.gms.google-services` plugin parses the JSON at build time); it just won't actually deliver pushes until Sprint 19.

3. **Biometric is a SECOND factor, not a password replacement.** OTP login (via Supabase `signInWithOtp` + `verifyOtp`) remains the *authoritative* authentication. Biometric only re-verifies an EXISTING session on app open — it never creates one, never bypasses an expired session, never replaces the OTP code paste. Failure ≥3 consecutive times → fall back to OTP login (full sign-out + redirect to `/login`). **review-security will audit this.** Symptom of getting it wrong: an attacker who steals the phone can biometric-bypass into the app even after Supabase has expired the JWT. The guard in `(app)/layout.tsx` (§4) reads `supabase.auth.getSession()` FIRST, then layers biometric on top of an already-valid session.

4. **`@sentry/capacitor` coexisting with `@sentry/nextjs`.** Two SDKs init in the same WebView process. `@sentry/nextjs` runs in the browser context (captures React errors, fetch failures, console.error); `@sentry/capacitor` wraps the native shell (captures Android Java crashes, iOS Swift crashes, native plugin failures). Both write to the same Sentry DSN (per Open Question 4). The risk: double-counting JS errors if both SDKs hook the same `window.onerror`. Mitigation: init `@sentry/capacitor` only inside `Capacitor.isNativePlatform()`, and configure it with `enableNative: true, enableJavascript: false` so it only forwards native events. The existing `@sentry/nextjs` JS instrumentation stays as-is.

5. **Symbolication upload pipeline is CONFIGURED in Sprint 16, EXECUTED in Sprint 19.** ProGuard mapping file and iOS dSYM upload commands are scripted this sprint but NOT run — actual uploads need (a) a Sentry auth token in CI/local env (Anton work), (b) a Mac for dSYM extraction (Sprint 19), (c) a release-signed build (Sprint 19 keystore work). Sprint 16 leaves a `scripts/upload-symbols.sh` (or `.ps1` — Windows host) that's runnable but currently a no-op without those secrets. **Do not block Sprint 16 on actual symbol upload working end-to-end** — that's a Sprint 19 verification surface.

---

## 2. `@capacitor/camera` integration pattern for `/scan`

### Current state inventory (post-Sprint-15)

- `frontend/src/app/(app)/scan/page.tsx` — client component (Sprint 15), auth gate via `useEffect`, renders `<ScannerFlow />`. OCR feature-flag gate removed (TODO comment intact for Sprint 16+).
- `frontend/src/components/scanner/scanner-flow.tsx` — state machine `idle → uploading → reviewing → saving → done | error`. Owns the `handleCapture(file: File)` callback that drives the OCR API call. **The plugin integration happens inside `CameraCapture`, not here.** ScannerFlow's contract is unchanged: it receives a `File`; how `CameraCapture` produced it is invisible.
- `frontend/src/components/scanner/camera-capture.tsx` — the only file that changes. Today: `getUserMedia({video: { facingMode: 'environment' }})` → MediaStream → `<video>` → `canvas.toBlob()` → `new File(...)`. Idle/active/previewing/permission-denied/no-camera states are all explicit. Hidden file input with `capture="environment"` is the gallery fallback.

### Decision

Replace `getUserMedia` with a single-shot `Camera.getPhoto({ source: CameraSource.Camera, … })` call **on native only**. Web fallback path (`getUserMedia` + file input) stays intact for the PWA build. The `CameraCapture` component's external API (`onCapture(file: File)`, `onCancel()`) does NOT change. State machine collapses on native (`Camera.getPhoto` is a single modal that returns a result or throws — no `'camera-active'` intermediate state; we go `idle → previewing` directly).

### Image format bridge

`Camera.getPhoto({ resultType: CameraResultType.DataUrl })` returns `{ dataUrl: string, format: 'jpeg' | 'png' }`. The OCR pipeline expects a `File`. The bridge:

```ts
async function dataUrlToFile(dataUrl: string, format: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  return new File([blob], `resibo-${Date.now()}.${ext}`, { type: mimeType });
}
```

`fetch(dataUrl)` works on data: URLs in Capacitor's WebView (verified pattern in `@capacitor/camera` README). Don't manually base64-decode — `fetch` is the canonical and lightest bridge.

**Quality + size:** pass `quality: 85` (matches the current `canvas.toBlob('image/jpeg', 0.85)` quality) and `width: 1600` to cap the long edge (OCR doesn't need 4032px; pre-shrinking trims OCR upload time and Claude vision spend). Don't set `correctOrientation: false` — let the plugin auto-rotate EXIF.

### Code template

```tsx
'use client';

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// …existing imports…

const isNative = Capacitor.isNativePlatform();

async function dataUrlToFile(dataUrl: string, format: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = format === 'png' ? 'png' : 'jpg';
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  return new File([blob], `resibo-${Date.now()}.${ext}`, { type: mimeType });
}

const startNativeCamera = useCallback(async () => {
  setError(null);
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.DataUrl,
      quality: 85,
      width: 1600,
      saveToGallery: false,
      // Plugin auto-prompts for permission on first call; subsequent calls reuse.
    });

    if (!photo.dataUrl) {
      setError('Walang nakuhang larawan. Subukan muli.');
      return;
    }

    const file = await dataUrlToFile(photo.dataUrl, photo.format);
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);
    setCapturedFile(file);
    setState('previewing');
  } catch (err) {
    // Camera.getPhoto throws on cancel ("User cancelled photos app") AND on denial.
    // The plugin doesn't separate them cleanly across platforms — sniff the message.
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('cancel') || msg.includes('user denied')) {
      // User backed out — treat like idle.
      setState('idle');
      return;
    }
    if (msg.includes('permission')) {
      setState('permission-denied');
      return;
    }
    setError('Hindi makapag-bukas ang camera. Subukan muli.');
    setState('idle');
  }
}, []);

// In the idle-state "Kunan ng litrato" button onClick:
const handleStartCamera = isNative ? startNativeCamera : startCamera;
```

Keep the existing `startCamera` (web `getUserMedia`) path untouched. The branching happens at the button click level via `isNative ? startNativeCamera : startCamera`. The `state === 'camera-active'` branch is **never entered on native** — `Camera.getPhoto` is modal; we go `idle → previewing` directly.

### Permission handling

**Android (`AndroidManifest.xml`):** add these `<uses-permission>` entries (currently only `INTERNET` is present):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

`CAMERA` is the runtime permission `Camera.getPhoto` requests. `READ_MEDIA_IMAGES` (Android 13+) enables gallery fallback via the plugin's `CameraSource.Photos`. `<uses-feature required="false">` keeps the app installable on cameraless tablets.

**iOS (`Info.plist`, Sprint 17/19 forward reference):** add `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`:

```xml
<key>NSCameraUsageDescription</key>
<string>Kailangan namin ng camera para ma-scan mo ang resibo mo.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Kailangan namin ng access sa photos mo para ma-upload mo ang resibo mo.</string>
```

These strings appear in the OS permission dialog — Apple rejects builds with vague reasons, so be specific. Sprint 16 documents these; iOS build prep happens Sprint 17 (or whenever Mac access lands).

**Runtime UX:** the plugin auto-fires the OS permission dialog on first `Camera.getPhoto` call. We do NOT need a separate `Camera.requestPermissions()` call — the implicit prompt is cleaner. Show a *pre-prompt* (an in-app explanation BEFORE the OS dialog) only on `state === 'permission-denied'` (the user previously denied and we need to point them to Settings).

### Conversational Filipino copy for permission states

Replace the existing `permission-denied` block strings:

- Title: `"Kailangan ng access sa camera"`
- Body: `"Para ma-scan natin ang resibo mo, i-allow mo muna ang camera sa Settings."` (`natin` enclitic in second position after `ma-scan`)
- CTA fallback button: `"Mag-upload na lang ng larawan"` (keep current)

For pre-prompt (idle-state copy can stay; the OS prompt is implicit on first tap):

- Existing `"I-scan ang resibo mo"` + `"Kunan ng litrato o mag-upload mula sa gallery"` is fine.

### Web fallback preservation

`getUserMedia` path stays in `camera-capture.tsx` as-is for the Vercel PWA build. The branch is one `isNative` check at the start of the "Kunan ng litrato" handler; everything below stays untouched. Vitest can mock `Capacitor.isNativePlatform()` to return `false` (default) for existing tests, and a separate native-mode test suite covers the new branch.

---

## 3. `@capacitor/push-notifications` integration pattern

### Current state inventory of the Web Push surface

5 API routes exist:
- `POST /api/push/subscribe` — accepts `{ endpoint, p256dh_key, auth_key }`, soft-deletes existing same-endpoint row, inserts new, ensures default `notification_preferences` rows
- `POST /api/push/unsubscribe` — accepts `{ endpoint }`, soft-deletes
- `POST /api/push/send` — service-role only, accepts `{ user_id, notification_type, title, body, … }`, fans out via `sendPushToUser`
- `PATCH /api/push/preferences` — updates one `notification_preferences` row
- `GET|PATCH /api/push/notifications` — list/mark-read for in-app bell

Schema on main (per `frontend/supabase/migrations/018_push_notifications.sql`):
- `push_subscriptions(id, user_id, endpoint TEXT NOT NULL, p256dh_key TEXT NOT NULL, auth_key TEXT NOT NULL, created_at, deleted_at)` + RLS + unique `(user_id, endpoint) WHERE deleted_at IS NULL`
- `notification_preferences(id, user_id, notification_type, enabled, …)` — unchanged this sprint
- `notifications(id, user_id, notification_type, title, body, url, read_at, …)` — unchanged this sprint

`lib/push/register.ts` is the client subscribe path (calls `Notification.requestPermission()` then `PushManager.subscribe()` then POSTs to `/api/push/subscribe`). `lib/push/send.ts` is the server-side fanout (calls `webpush.sendNotification` for every active subscription row).

### Decision

Native push uses **APNs (iOS) + FCM (Android)**, NOT Web Push VAPID. The two delivery mechanisms coexist:
- **Web** (browser tab + PWA install) → Web Push via VAPID, existing path unchanged.
- **Native** (Capacitor Android/iOS) → FCM/APNs token registered via `@capacitor/push-notifications`, persisted with `platform = 'android' | 'ios'`, delivered via Firebase Admin SDK (Sprint 19 wiring).

One `push_subscriptions` table with a `platform` discriminator (Open Question 1, recommendation (a)). Build-data writes the migration per §8.

### Schema decision (LOCKED for build-data)

Alter `push_subscriptions`:
- ADD `platform TEXT NOT NULL DEFAULT 'web'` with `CHECK (platform IN ('web', 'android', 'ios'))`
- ADD `native_token TEXT NULL` (FCM or APNs token; null for `platform='web'` rows)
- ADD `device_id TEXT NULL` (Capacitor-emitted device UUID for multi-device disambiguation)
- ALTER `p256dh_key` to `NULL`-able (was NOT NULL — required only for web rows)
- ALTER `auth_key` to `NULL`-able (same)
- DROP unique index `idx_push_subs_user_endpoint`
- ADD partial unique index for web rows: `CREATE UNIQUE INDEX idx_push_subs_user_endpoint_web ON push_subscriptions(user_id, endpoint) WHERE deleted_at IS NULL AND platform = 'web';`
- ADD partial unique index for native rows: `CREATE UNIQUE INDEX idx_push_subs_user_native_token ON push_subscriptions(user_id, native_token) WHERE deleted_at IS NULL AND native_token IS NOT NULL;`
- RLS policies unchanged (still `auth.uid() = user_id`).
- Soft-delete column `deleted_at TIMESTAMPTZ NULL` already present from migration 018 — no change.

**Backfill:** all existing rows are web; `DEFAULT 'web'` handles them automatically. No data migration needed.

**Test seed updates:** existing test fixtures using `push_subscriptions` need an explicit `platform: 'web'` in their inserts (or rely on the default). Build-qa flags any test that breaks.

### API route updates

Add a `platform` field to `SubscribePushSchema` and treat the body as a discriminated union:

```ts
// frontend/src/lib/push/schemas.ts — replace SubscribePushSchema

export const SubscribePushSchema = z.discriminatedUnion('platform', [
  z.object({
    platform: z.literal('web'),
    endpoint: z.string().url('Kailangan ng valid push endpoint URL.'),
    p256dh_key: z.string().min(1, 'Kailangan ng p256dh key.'),
    auth_key: z.string().min(1, 'Kailangan ng auth key.'),
  }),
  z.object({
    platform: z.enum(['android', 'ios']),
    native_token: z.string().min(1, 'Kailangan ng native push token.'),
    device_id: z.string().min(1).optional(),
  }),
]);
```

`POST /api/push/subscribe` route logic changes:
- Web branch: existing soft-delete by `(user_id, endpoint)` + insert with `platform: 'web'`. No other change.
- Native branch: soft-delete existing row by `(user_id, native_token)` (NOT endpoint) + insert with `endpoint = ''` or `endpoint = native_token` (whichever satisfies NOT NULL; recommend writing the token into `endpoint` AND `native_token` for the native rows, so the column stays NOT NULL and existing reads don't break).

`POST /api/push/unsubscribe` accepts either `{ endpoint }` (web) or `{ native_token }` (native) — extend `UnsubscribePushSchema` symmetrically. **Engineer recommendation:** add an `OR` filter in the route rather than splitting routes.

`POST /api/push/send` (service-role fanout) — no API shape change, but `lib/push/send.ts` `sendPushToUser` branches on `platform`:
- For `platform='web'` rows → existing `webpush.sendNotification(…)` path
- For `platform='android' | 'ios'` rows → Sprint 19 Firebase Admin SDK call (Sprint 16 leaves a `// TODO(sprint-19): wire firebase-admin sendToToken` and logs `[push] skipping native delivery — pending Sprint 19 FCM wiring`)

### `frontend/src/lib/push/capacitor-push.ts` new module

```ts
'use client';

/**
 * Capacitor Native Push — register FCM/APNs token, post to /api/push/subscribe.
 * Feature: Native Push Notifications (Sprint 16, Gap G4 mitigation)
 * Role: Native-only push registration. Web path stays in lib/push/register.ts.
 *
 * IMPORTANT: This module is a no-op on web (Capacitor.isNativePlatform() === false).
 *            Call sites should branch on platform; do not import for web flows.
 */

import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type PushNotificationSchema,
  type Token,
  type ActionPerformed,
} from '@capacitor/push-notifications';

let listenersBound = false;

export async function isNativePushSupported(): Promise<boolean> {
  return Capacitor.isNativePlatform();
}

export async function registerNativePush(): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Native push is only available in the Capacitor build.' };
  }

  // --- Request permission (iOS implicit; Android 13+ requires runtime grant) ---
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    return { success: false, error: 'Hindi pa naka-allow ang notifications.' };
  }

  // --- Bind listeners exactly once ---
  if (!listenersBound) {
    await PushNotifications.addListener('registration', async (token: Token) => {
      try {
        const platform: 'android' | 'ios' =
          Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            native_token: token.value,
          }),
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[push] native subscribe POST failed', err);
      }
    });

    await PushNotifications.addListener('registrationError', (err) => {
      // eslint-disable-next-line no-console
      console.error('[push] native registration error', err);
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (_n: PushNotificationSchema) => {
        // Foreground delivery — the OS does not display the system banner.
        // Sprint 17 polish: surface an in-app toast. Sprint 16: silent.
      }
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const url = action.notification.data?.url;
        if (typeof url === 'string' && url.length > 0) {
          window.location.href = url;
        }
      }
    );

    listenersBound = true;
  }

  // --- Trigger registration; the 'registration' listener handles the POST ---
  await PushNotifications.register();

  return { success: true };
}

export async function unregisterNativePush(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  // The plugin doesn't expose unregister; we soft-delete the row by native_token.
  // Caller fetches the cached token and POSTs to /api/push/unsubscribe.
  // Sprint 16: leave this as a stub — preference toggle is the primary disable path.
}
```

### `google-services.json` placeholder pattern

**Location:** `frontend/android/app/google-services.json` (Gradle plugin reads from this exact path).

**Placeholder shape** (commit this to main):

```json
{
  "_comment": "PLACEHOLDER — replace with real google-services.json from Firebase Console in Sprint 19. See gap-registry.md G4 + sprint-history Sprint 19 entry. This stub lets the com.google.gms.google-services Gradle plugin parse the file so the build succeeds; it does NOT deliver real pushes.",
  "project_info": {
    "project_number": "000000000000",
    "project_id": "akbai-placeholder",
    "storage_bucket": "akbai-placeholder.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
        "android_client_info": {
          "package_name": "com.akbai.app"
        }
      },
      "oauth_client": [],
      "api_key": [{ "current_key": "PLACEHOLDER_DO_NOT_USE" }],
      "services": {
        "appinvite_service": { "other_platform_oauth_client": [] }
      }
    }
  ],
  "configuration_version": "1"
}
```

**`.gitignore` strategy:** the placeholder ships in main. When Anton drops a real one locally (Sprint 19), git-status will show modifications. To prevent accidental commits of the real file, add to `frontend/.gitignore`:

```
# Sprint 19+: real google-services.json must NOT be committed.
# Placeholder is tracked; real file (with real project_number) must be added to
# a local override. To use a real file, rename it google-services.local.json
# and configure Gradle to prefer it — Sprint 19 task.
frontend/android/app/google-services.local.json
```

**Recommendation:** Sprint 16 documents this in a comment in the placeholder; Sprint 19 wires the Gradle preference for `.local.json` over the placeholder.

**Apple `GoogleService-Info.plist`:** equivalent placeholder for iOS, deferred entirely to Sprint 17/19 alongside the iOS build prep.

### Permission UX flow

Deferred prompt trigger per Open Question 2 (a) — fired from `/deadlines` on first deadline-within-14-days encounter.

The in-app pre-prompt explanation MUST fire BEFORE the OS dialog (Apple/Google both reject apps that prompt cold). Suggested copy in a dialog or inline banner:

- Headline: `"Gusto mo bang i-paalala ng AKBai ang BIR deadlines mo?"` (VSO; `i-paalala` is the Filipinized verb)
- Body: `"Magpapadala kami ng notification 7 araw, 3 araw, at 1 araw bago mag-due ang mga form mo. Puwede mong i-off anytime sa Settings."` (no English SVO; `bago mag-due` is the Filipino frame; "anytime" is a borderline borrowing but acceptable per the guide's allowed-English list — could also be `"kahit kailan"`)
- Primary CTA: `"Sige, paalalahanan mo ako"` (the OS dialog fires after tap)
- Secondary: `"Hindi, salamat"` (writes `akbai_push_dismissed_at` to localStorage; do not re-prompt within 30 days)

Both `notification_preferences` defaults stay enabled at `true` (existing migration 018 behavior); the toggle on `/profile` (existing UI from Build 5/6) is the user-facing on/off after grant.

### Conversational Filipino copy — notification body templates

`lib/push/deadline-triggers.ts` already produces conversational Filipino bodies for BIR deadlines (`buildDeadlinePushText`). No change required this sprint. For the registration error toast (rare path):

- `"Hindi naka-rehistro ang push notifications mo. Subukan muli sa Settings."` (i-affix on `naka-rehistro`; `mo` enclitic in second position; no "based sa")

---

## 4. `@capacitor-community/biometric-auth` integration pattern

### Decision

Face ID / fingerprint as an **optional second factor** that re-verifies an EXISTING valid Supabase session on app open. Behavior:

- If `users.biometric_enabled = false` (default) → no biometric prompt, app boots normally
- If `users.biometric_enabled = true` AND `Capacitor.isNativePlatform()` AND device supports biometric → after auth check resolves a valid session, fire biometric prompt; on success, render the app; on failure, increment counter
- ≥3 consecutive failures within a session → sign out + redirect to `/login` (OTP becomes the recovery path)
- On web → flag is ignored entirely (no Web Authentication path in scope for Sprint 16)

### Onboarding step 6.25 (per Open Question 3 (a))

Insert between celebrate (step 6) and PWA install (step 6.5). Only renders if `Capacitor.isNativePlatform()`. Shape mirrors existing `OnboardingShell` (Kai illustration + prompt + content row). Engineer adds a new file `frontend/src/components/onboarding/step-biometric.tsx` and wires it in `OnboardingWizard` between the `currentStep === 6` celebrate block and the `currentStep === 6.5` install block.

Copy:
- Prompt (Kai's line): `"Gusto mo bang i-secure ang AKBai gamit ang Face ID o fingerprint?"` (VSO; `i-secure` is the Filipinized verb)
- Subtitle: `"Para mas ligtas — bago tayo magbukas ng app, kailangan namin ng mukha o fingerprint mo."` (enclitic `tayo` in second position after `bago`)
- Primary: `"Sige, i-enable mo"` (calls `BiometricAuth.authenticate(...)` to confirm device support, then PATCHes `/api/profile { biometric_enabled: true }`)
- Secondary: `"Skip muna"` (closes step, no DB write — default already `false`)

After success, fire a `setCurrentStep(6.5)` (continue to PWA install). After skip, same. Both paths converge.

### On-app-open guard placement in `(app)/layout.tsx`

The persona `useEffect` from Sprint 15 already runs on mount. Add a second `useEffect` BEFORE persona that checks biometric. The shell continues to render (children + nav); the biometric prompt is modal-overlay above. Children render in a hidden state (or under an overlay) until biometric resolves.

```tsx
// Add to (app)/layout.tsx — after the persona useState, before the existing useEffect.

const [biometricStatus, setBiometricStatus] = useState<
  'pending' | 'not-required' | 'verifying' | 'verified' | 'failed'
>('pending');
const biometricFailureCount = useRef(0);

useEffect(() => {
  let cancelled = false;
  async function gateBiometric() {
    if (!Capacitor.isNativePlatform()) {
      if (!cancelled) setBiometricStatus('not-required');
      return;
    }

    // Confirm session is valid first — biometric is a second factor, NEVER first.
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Per-page auth gate will redirect to /login; biometric is irrelevant.
      if (!cancelled) setBiometricStatus('not-required');
      return;
    }

    // Check the user's preference.
    const profileRes = await fetch('/api/profile');
    if (!profileRes.ok) {
      if (!cancelled) setBiometricStatus('not-required');
      return;
    }
    const profileJson = await profileRes.json();
    if (!profileJson.success || profileJson.data.biometric_enabled !== true) {
      if (!cancelled) setBiometricStatus('not-required');
      return;
    }

    if (!cancelled) setBiometricStatus('verifying');
    try {
      const { BiometricAuth } = await import('@capacitor-community/biometric-auth');
      await BiometricAuth.authenticate({
        reason: 'Kumpirmahin natin na ikaw nga',
        cancelTitle: 'Cancel',
        fallbackTitle: 'Gamitin ang PIN',
      });
      if (!cancelled) setBiometricStatus('verified');
    } catch {
      biometricFailureCount.current += 1;
      if (biometricFailureCount.current >= 3) {
        // Hard fallback — sign out, force OTP login.
        await supabase.auth.signOut();
        window.location.href = '/login?error=biometric_failed';
        return;
      }
      if (!cancelled) setBiometricStatus('failed');
    }
  }
  void gateBiometric();
  return () => {
    cancelled = true;
  };
}, []);
```

Render gate:

```tsx
return (
  <>
    <SessionGuard />
    <SidebarNav persona={persona} />
    <div className="tablet:ml-60">
      {biometricStatus === 'verifying' ? (
        <BiometricOverlay status="verifying" onRetry={() => { /* retry */ }} />
      ) : biometricStatus === 'failed' ? (
        <BiometricOverlay
          status="failed"
          attemptsRemaining={3 - biometricFailureCount.current}
          onRetry={() => { /* re-fire useEffect logic */ }}
        />
      ) : (
        children
      )}
    </div>
    <BottomNav />
    {/* …existing SW registration script… */}
  </>
);
```

`BiometricOverlay` is a new lightweight component (a card with Kai sitting + a "Gamitin ang biometric muli" button). Engineer creates it under `frontend/src/components/auth/biometric-overlay.tsx`.

### Failure-fallback counter

`useRef<number>` is sufficient — the counter resets on every app open (which is when the guard fires). Persisting across cold starts would over-punish a user whose Face ID glitched once. The 3-failure threshold matches the typical OS-level biometric retry budget; after 3 failures the user lands on `/login` with OTP, which has its own rate-limit at `enforceRateLimit({ key: 'login', … })` (Sprint 15 didn't adopt this on `/login` specifically; out of scope to add here).

### Schema (LOCKED for build-data)

Add two columns to `public.users`:

```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS biometric_setup_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.biometric_enabled
  IS 'User opted into biometric second-factor on app open (native only). Default false. Set true via /api/profile PATCH after a successful BiometricAuth.authenticate test.';

COMMENT ON COLUMN public.users.biometric_setup_at
  IS 'Audit trail: when biometric was enabled. Null until first enable. Reset to null on disable.';
```

RLS on `users` already enforces `auth.uid() = id` (per migration 001) — no new policies needed.

### `/api/profile` PATCH extension

`/api/profile` PATCH today accepts business_profile fields; extend the Zod schema to also accept `biometric_enabled: boolean`. On `true`, set `biometric_setup_at = now()`. On `false`, set `biometric_setup_at = NULL`. Soft-delete N/A here (we're not removing the user, just toggling a column).

### Conversational Filipino copy

- **Onboarding step 6.25 prompt:** `"Gusto mo bang i-secure ang AKBai gamit ang Face ID o fingerprint?"`
- **Onboarding skip:** `"Skip muna — puwede ko itong i-enable mamaya sa Settings."`
- **App-open verifying state:** `"Sandali, kinukumpirma ka namin."` (enclitic `ka namin` in second position)
- **App-open failed state (1-2 failures left):** `"Hindi ka namatch. Subukan mo ulit."` (`namatch` is the Filipinized passive of "match" with `na-` affix)
- **App-open failed state final (after 3 failures):** rendered as `/login?error=biometric_failed` toast: `"Sobrang dami ng failed na biometric. I-login mo ulit gamit ang OTP."` (matches the rate-limit-style "Sobrang dami" pattern from `lib/rate-limit/middleware.ts`)
- **`/profile` toggle (re-verify on enable):** `"I-confirm muna namin gamit ang biometric mo bago i-save."` (`namin` enclitic in second position after `i-confirm`; `bago i-save` is the canonical Filipino frame from CLAUDE.md non-negotiable #5)
- **`/profile` toggle (denial after disable attempt):** N/A — disable is a one-tap action with no biometric re-prompt; the user is already inside the app, which already passed biometric on open. Sprint 19 hardening could add a re-prompt, but it's not required for Sprint 16.

---

## 5. Deep linking config

### Custom scheme

`com.akbai.app://auth/callback` (matches `appId` from `capacitor.config.ts`).

### `capacitor.config.ts` extension

Current file (10 lines, 4 fields). Add an `appUrlOpen` server config to register the deep-link scheme, AND wire an `App.addListener('appUrlOpen', …)` handler in client code that routes the URL into Next's router. The Capacitor approach: the plugin `@capacitor/app` (already a transitive dependency through `@capacitor/core`) emits `appUrlOpen` events; the listener belongs in a client-side mount, NOT in the config file.

The config file gains the Android intent-filter declaration via `android.intentFilters` (Capacitor 5+ moved this from manifest editing into config when possible). Updated file:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akbai.app',
  appName: 'AKBai',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    // Deep-link intent filter is declared in AndroidManifest.xml directly
    // (Capacitor's config object doesn't accept intentFilters on the android
    // adapter — see Capacitor docs §Configuration §Android Configuration).
    // See §Deep linking §AndroidManifest.xml below for the exact XML.
  },
};

export default config;
```

(The `android` object stays minimal; the actual intent-filter XML lives in `AndroidManifest.xml` per the comment.)

### `AndroidManifest.xml` `<intent-filter>` (add inside `<activity>`)

```xml
<intent-filter android:label="@string/title_activity_main" android:autoVerify="false">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.akbai.app" android:host="auth" />
</intent-filter>
```

This handles the `com.akbai.app://auth/callback` scheme. `android:autoVerify="false"` because we're using a custom scheme (not an `https` App Link with a `.well-known` file); the OS doesn't need to verify domain ownership.

### iOS `Info.plist` `CFBundleURLTypes` (Sprint 17/19 forward reference)

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.akbai.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.akbai.app</string>
        </array>
    </dict>
</array>
```

### Client-side listener (auth callback page)

The Sprint 15 `auth/callback/page.tsx` uses `useSearchParams()` to pull `code` and `next` from a URL. With deep linking on native, the URL arrives as a single string (`com.akbai.app://auth/callback?code=abc&next=/dashboard`) and needs to be parsed once at the top of the listener.

Pattern: in `(app)/layout.tsx` or a root-level client mount, add:

```ts
import { App, type URLOpenListenerEvent } from '@capacitor/app';

useEffect(() => {
  if (!Capacitor.isNativePlatform()) return;
  const handle = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    try {
      const url = new URL(event.url);
      // url.pathname for com.akbai.app://auth/callback is '/callback' — strip and route.
      if (url.host === 'auth' && url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const next = url.searchParams.get('next') ?? '/dashboard';
        if (code) {
          // Forward to the existing /auth/callback page via web navigation —
          // its existing useSearchParams logic handles the rest.
          window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
        }
      }
    } catch {
      // Malformed URL — ignore.
    }
  });
  return () => {
    void handle.then((h) => h.remove());
  };
}, []);
```

`auth/callback/page.tsx` (PKCE code-exchange page from Sprint 15) is UNTOUCHED in its core logic — only the entry routing changes. PKCE `code_verifier` retrieval inside Capacitor's sandboxed localStorage still happens via `exchangeCodeForSession`. **review-security verifies this path** per §7 carry-over.

### `appUrlOpen` placement decision

Best home: `(app)/layout.tsx` (already a client component, already runs on every native app open). Engineer can either add the listener directly in the layout's `useEffect` block, or extract to a small `frontend/src/lib/capacitor/deep-link.ts` helper for testability. **Recommendation: extract.** Vitest can mock the `@capacitor/app` import; an in-layout listener is harder to test in isolation.

---

## 6. Sentry native crash symbolication pipeline

### `@sentry/capacitor` install + init pattern

Install: `npm install --save @sentry/capacitor @sentry/angular-ivy@^7` (the Capacitor SDK has a peer-dep on a Sentry framework SDK — see Sentry docs; the `@sentry/angular-ivy` peer is satisfied transitively by `@sentry/nextjs` already in the project, but verify at install time).

Init: in `(app)/layout.tsx` or a new `frontend/src/lib/sentry/capacitor-init.ts` module called from layout:

```ts
import { Capacitor } from '@capacitor/core';

export async function initSentryCapacitor() {
  if (!Capacitor.isNativePlatform()) return;
  const SentryCapacitor = await import('@sentry/capacitor');
  SentryCapacitor.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enableNative: true,
    enableJavascript: false, // @sentry/nextjs handles JS errors; avoid double-capture
    release: process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev',
  });
}
```

The DSN is read from the existing `NEXT_PUBLIC_SENTRY_DSN` env var (Sentry's Next.js plugin already requires it). Same DSN → same project; the `sdk.name` field on each event envelope distinguishes `sentry.javascript.nextjs` from `sentry.capacitor` in saved searches.

### Android ProGuard mapping file (build-time config)

`frontend/android/app/build.gradle` — add inside `android.buildTypes.release`:

```groovy
release {
    minifyEnabled true
    shrinkResources true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
}
```

This generates `frontend/android/app/build/outputs/mapping/release/mapping.txt` on every release build. The mapping file is the artifact `sentry-cli` uploads to symbolicate stack traces.

**`.gitignore` additions** (`frontend/android/app/.gitignore` or `frontend/.gitignore`):

```
# Build artifacts — do NOT commit. Upload to Sentry via scripts/upload-symbols
# (Sprint 19). Mapping files are per-release and rebuilt every assembleRelease.
android/app/build/outputs/mapping/
android/app/build/outputs/dsym/
```

### iOS dSYM extraction (Sprint 19 forward reference)

dSYM files are produced by Xcode during Archive. On a Mac (Sprint 19 work):

```bash
# After xcodebuild -archive, dSYMs land at:
# build/AKBai.xcarchive/dSYMs/AKBai.app.dSYM
sentry-cli upload-dif --org $SENTRY_ORG --project $SENTRY_PROJECT \
  build/AKBai.xcarchive/dSYMs/
```

Sprint 16 ships the script but does NOT run it (no Mac available).

### `sentry-cli` upload script

Create `frontend/scripts/upload-symbols.ps1` (Windows host, PowerShell native — bash equivalent for Sprint 19 Mac at `frontend/scripts/upload-symbols.sh`):

```powershell
# scripts/upload-symbols.ps1
# Sprint 16: configured; Sprint 19: executed (needs SENTRY_AUTH_TOKEN + Mac for dSYM).
# Usage: pwsh scripts/upload-symbols.ps1 -Release "akbai-android@1.0.0"

param(
    [Parameter(Mandatory=$true)][string]$Release
)

if (-not $env:SENTRY_AUTH_TOKEN) {
    Write-Host "SENTRY_AUTH_TOKEN missing — skipping symbol upload (Sprint 19 task)."
    exit 0
}

$mappingFile = "android/app/build/outputs/mapping/release/mapping.txt"
if (Test-Path $mappingFile) {
    & sentry-cli upload-dif --type proguard --org $env:SENTRY_ORG --project $env:SENTRY_PROJECT $mappingFile
} else {
    Write-Host "No ProGuard mapping at $mappingFile (debug build?). Skipping."
}

# dSYM upload — only runs on macOS; Windows host skips.
if ($IsMacOS) {
    Get-ChildItem -Recurse -Filter "*.dSYM" -Path "ios/" | ForEach-Object {
        & sentry-cli upload-dif --org $env:SENTRY_ORG --project $env:SENTRY_PROJECT $_.FullName
    }
}
```

**Corporate-TLS caveat (per SPIKE_FINDINGS.md §Toolchain install):** `sentry-cli` is a Rust binary that uses its own TLS stack. If it hits a handshake error on Anton's network, the workaround is `--insecure` flag (one-shot, for debug uploads only) OR `SENTRY_HTTP_PROXY=$env:HTTP_PROXY` if a corporate proxy is configured. The cacerts21 keystore patch from Sprint 15 does NOT help `sentry-cli` directly (it's a Java keystore, sentry-cli uses native-tls/rustls). Document this in the script comments for Sprint 19.

### `.gitignore` additions for symbolication artifacts

Add to `frontend/.gitignore`:

```
# Symbolication artifacts (Sentry crash dedup) — uploaded via scripts/upload-symbols.
# Rebuilt every release; never committed.
android/app/build/outputs/mapping/
ios/build/**/dSYMs/
*.dSYM/
*.dSYM.zip
```

---

## 7. Security flags for review-security agent

Four audit surfaces this sprint. Each is independent; review-security can do them in any order.

1. **Camera permission flow** — no surreptitious capture (no `Camera.getPhoto` calls outside the user-initiated `/scan` flow); clear conversational Filipino pre-prompt only on `permission-denied` state (not before first ask, since `Camera.getPhoto` itself fires the OS prompt with context). Verify: file under `frontend/src/components/scanner/camera-capture.tsx` should have ZERO `Camera.getPhoto` calls outside the `startNativeCamera` callback.

2. **Push consent NPC RA 10173 compliance** — consent must be recorded with a timestamp; revoke path must be one-tap. Verify: `notification_preferences` rows are written on subscribe (existing behavior from `ensureDefaultPreferences`); the `/profile` toggle path PATCHes `notification_preferences` (existing behavior). Native path persists in the same table — no new consent record needed. NPC compliance carries over from Sprint 12's existing push wiring.

3. **Biometric implementation review** — verify (a) biometric NEVER creates a session, only re-verifies one; (b) `BiometricAuth.authenticate` is called AFTER `supabase.auth.getSession()` confirms a valid session; (c) 3-failure fallback signs out and lands on `/login` (NOT a soft retry loop); (d) `users.biometric_enabled = false` skips the prompt entirely (default state). File: `(app)/layout.tsx` second `useEffect`.

4. **Carry-over from Sprint 15: PKCE `code_verifier` retrieval in Capacitor sandboxed localStorage** on `auth/callback/page.tsx`. Sprint 15 Open Question #3 flagged this for follow-up; Sprint 15 retro action item 4 carries it forward. **review-security task this sprint:** confirm that `supabase.auth.exchangeCodeForSession(code)` inside `auth/callback/page.tsx` successfully reads the `code_verifier` from the Capacitor WebView's localStorage when invoked via the deep-link routing path from §5. Test method: build a debug `.apk` with `NEXT_PUBLIC_SKIP_AUTH=false` and a real Supabase env, send a magic-link email to a test account, click the link on the Pixel 5, observe whether the deep-link routes to `/auth/callback` AND whether the exchange succeeds (`auth.getUser()` returns the test user). If it fails with "PKCE verifier not found", that's the Sprint 16 fix: add a Capacitor-specific Supabase storage adapter (likely `@capacitor/preferences` as the localStorage replacement). Cost: ~2 hrs if the bug exists, 0 if it doesn't.

---

## 8. Schema migration shapes (build-data hand-off)

Two migrations this sprint, in this order. Migration numbering: sequence advances async between sessions per `feedback_migration_numbering` memory rule — reference by content, not ordinal. The next sequential filename after `019_morning_briefing_tone.sql` would be `020`, but if another migration lands first on `dev`, adjust to `021` etc.

### Migration A: push subscription platform support

**Filename intent:** `0XX_push_subscription_platform.sql` (build-data picks the ordinal).

**Columns/changes:**
- `ALTER TABLE push_subscriptions ADD COLUMN platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios'));`
- `ALTER TABLE push_subscriptions ADD COLUMN native_token TEXT NULL;`
- `ALTER TABLE push_subscriptions ADD COLUMN device_id TEXT NULL;`
- `ALTER TABLE push_subscriptions ALTER COLUMN p256dh_key DROP NOT NULL;`
- `ALTER TABLE push_subscriptions ALTER COLUMN auth_key DROP NOT NULL;`
- `DROP INDEX IF EXISTS idx_push_subs_user_endpoint;`
- `CREATE UNIQUE INDEX idx_push_subs_user_endpoint_web ON push_subscriptions(user_id, endpoint) WHERE deleted_at IS NULL AND platform = 'web';`
- `CREATE UNIQUE INDEX idx_push_subs_user_native_token ON push_subscriptions(user_id, native_token) WHERE deleted_at IS NULL AND native_token IS NOT NULL;`

**RLS impact:** none. Existing 3 policies on `push_subscriptions` (select/insert/update with `auth.uid() = user_id`) cover the new columns.

**Soft-delete:** `deleted_at TIMESTAMPTZ NULL` already exists from migration 018 — no change.

**Comments to add:**
- `platform`: `'Source of subscription. Web Push (VAPID, p256dh_key + auth_key + endpoint) vs native (FCM/APNs token in native_token). Sprint 16 / Gap G4 mitigation.'`
- `native_token`: `'FCM token (Android) or APNs token (iOS). NULL for platform=web rows. Sprint 16.'`
- `device_id`: `'Optional Capacitor-emitted device UUID for multi-device disambiguation. NULL for web. Sprint 16.'`

**Rollback notes (for migration safety doc):** to roll back, soft-delete all `platform != 'web'` rows first, then drop the new columns + indexes, then re-NOT-NULL the VAPID columns. Engineer doesn't write the rollback migration this sprint — it's traced in the migration's comment header.

### Migration B: users biometric columns

**Filename intent:** `0XX_users_biometric.sql`.

**Columns/changes:**
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN NOT NULL DEFAULT false;`
- `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS biometric_setup_at TIMESTAMPTZ NULL;`

**RLS impact:** none. Existing `users_select_own` / `users_update_own` policies (migration 001) cover both columns. No new policies.

**Soft-delete:** `users.deleted_at TIMESTAMPTZ NULL` already exists — no change.

**Comments to add:**
- `biometric_enabled`: `'User opted into biometric second-factor on app open (native only). Default false. Set true via /api/profile PATCH after successful BiometricAuth.authenticate verify. Sprint 16 / Gap G4 mitigation.'`
- `biometric_setup_at`: `'Audit trail for biometric enable. Null until first enable; reset to null on disable. Sprint 16.'`

**Test seed updates:** existing test fixtures that insert into `users` will continue to work (defaults). Tests that toggle biometric need explicit inserts.

### Order

A first, B second (no inter-dependency, but A is the load-bearing one for batch 2 of engineer work; B is consumed in batch 3).

---

## 9. Order of operations recommendation for engineer

Three sequential batches, smallest-blast-radius first within each batch. Mirrors Sprint 15's §11 shape.

### Batch 1: Camera + deep-link foundations

Lowest risk. The camera swap is mechanical (one branch in one file); deep linking is config-only.

1. `npm install --save @capacitor/camera @capacitor/app` (verify `@capacitor/app` isn't already pulled transitively — if it is, skip).
2. Update `frontend/android/app/src/main/AndroidManifest.xml` per §2 (camera + media perms) AND §5 (intent-filter).
3. Convert `frontend/src/components/scanner/camera-capture.tsx` per §2 — add `isNative` branch on the "Kunan ng litrato" handler; web path untouched.
4. Add deep-link helper module `frontend/src/lib/capacitor/deep-link.ts` per §5 listener pattern, and wire its `useEffect` consumer in `(app)/layout.tsx` (or root `app/layout.tsx` — engineer picks; the listener doesn't depend on `(app)` group middleware).
5. Smoke: web `npm run build` must still pass (no env-var changes, no schema work yet).

Run `CAPACITOR_BUILD=1 npm run build && npx cap sync android && cd android && ./gradlew assembleDebug` to verify the Android build still produces an installable APK. Camera UI is testable on-device when Anton picks it up; engineer doesn't device-test this sprint.

### Batch 2: Push platform extension + native registration

Schema-touching batch. Build-data writes migration A BEFORE engineer starts.

1. `npm install --save @capacitor/push-notifications`.
2. Wait for build-data: migration A merged to `dev`/`main`.
3. Update `frontend/src/lib/push/schemas.ts` per §3 (discriminated union for `SubscribePushSchema`; symmetric extension for `UnsubscribePushSchema`).
4. Update `frontend/src/app/api/push/subscribe/route.ts` per §3 (branch on `platform`; web path 1:1 preserved).
5. Update `frontend/src/app/api/push/unsubscribe/route.ts` similarly.
6. Update `frontend/src/lib/push/send.ts` per §3 (branch on `platform`; native path is a TODO log for Sprint 19).
7. Add `frontend/src/lib/push/capacitor-push.ts` per §3.
8. Add `google-services.json` placeholder per §3 + `.gitignore` entry.
9. Update `frontend/android/app/build.gradle` to apply `com.google.gms.google-services` plugin (and add the dependency to `frontend/android/build.gradle` classpath).
10. Wire the deferred-prompt trigger per §3 Open Question 2 (a) — add a `useEffect` to `frontend/src/app/(app)/deadlines/page.tsx` (or its child list component) that fires once on first within-14-days deadline view, gated by localStorage `akbai_push_prompted_at`.
11. Smoke: existing 1331 vitest suite stays green (mock `Capacitor.isNativePlatform()` for the new branches; existing tests touch the web path only and should not regress).

### Batch 3: Biometric + Sentry symbolication

Schema-touching batch. Build-data writes migration B BEFORE engineer starts. This batch is the highest-touch on user-facing flow because of the `(app)/layout.tsx` overlay.

1. `npm install --save @capacitor-community/biometric-auth @sentry/capacitor`.
2. Wait for build-data: migration B merged.
3. Update `frontend/src/app/api/profile/route.ts` Zod schema to accept `biometric_enabled: z.boolean().optional()`; PATCH branch sets `biometric_setup_at = now()` on `true`, null on `false`.
4. Add `frontend/src/components/auth/biometric-overlay.tsx` per §4 render-gate sketch.
5. Update `frontend/src/app/(app)/layout.tsx` per §4 — add the biometric `useEffect`, the `biometricStatus` state, and the children-overlay branch.
6. Add `frontend/src/components/onboarding/step-biometric.tsx` per §4 (gated by `Capacitor.isNativePlatform()` — web users skip the whole step).
7. Wire step 6.25 into `frontend/src/components/onboarding/onboarding-wizard.tsx` between celebrate (`6`) and PWA install (`6.5`).
8. Add `frontend/src/lib/sentry/capacitor-init.ts` per §6; call from `(app)/layout.tsx` on mount (gated by `Capacitor.isNativePlatform()`).
9. Update `frontend/android/app/build.gradle` per §6 (ProGuard `minifyEnabled true` on release).
10. Add `frontend/scripts/upload-symbols.ps1` per §6 (Windows host); leave a `.sh` companion stub for Sprint 19 Mac work.
11. Update `frontend/.gitignore` with the mapping/dSYM patterns from §6.
12. Run `CAPACITOR_BUILD=1 npm run build && npx cap sync android && cd android && ./gradlew assembleRelease` (release build this time, to verify ProGuard mapping is produced). Skip if release signing isn't configured — debug build is fine for Sprint 16 acceptance; release-signing waits for Sprint 19.
13. Final smoke: full vitest suite still green; `.aab` and `.apk` debug builds still under 22 MB target (15 MB baseline + ~7 MB plugin headroom).

### Bundle-size guard

The bundle-size guard test at `frontend/src/lib/__tests__/bundle-size-guard.test.ts` (Sprint 15) reads the `.aab` / `.apk` sizes. **Update its ceiling for Sprint 16:** new threshold `22 MB` (was effectively `30 MB`). Build-qa adjusts the constant + runs the regression.

---

## 10. References

- ADR-019 (Accepted Green, Sprint 15 close-out): `akbai-delivery/skills/solutions-architect/references/architecture-decisions.md` §1098-1228
- Sprint 15 conversion pattern doc (the shape this doc mirrors): `akbai-delivery/skills/solutions-architect/references/sprint-15-conversion-pattern.md`
- Deployment guide §Capacitor Build Pipeline (Sprint 15+): `akbai-delivery/skills/devops-engineer/references/deployment-guide.md` §242-271
- SPIKE_FINDINGS §Toolchain install + §5 build command (corporate-TLS recipe): `C:\Users\Anton del Rosario\akbai-spike\SPIKE_FINDINGS.md`
- Sprint 15 retro entry (carry-over action items): `akbai-delivery/shared/sprint-history.md` §1598-1702
- Tech stack canonical: `akbai-delivery/shared/tech-stack.md`
- Conversational Filipino copy guide: `akbai-delivery/skills/ux-designer/references/conversational-filipino-copy-guide.md`
- Gap registry G4 (Apple Guideline 4.2 mitigation — load-bearing for this sprint): `akbai-delivery/shared/gap-registry.md` §G4

---

## 11. Hand-off

- **build-data:**
  - Migration A first (`push_subscriptions` platform extension per §8). Then migration B (`users` biometric columns).
  - Both write idempotently with `IF NOT EXISTS` / `IF EXISTS` on column/index DDL where possible.
  - Apply RLS audit script after each: confirm `users.biometric_enabled` and `push_subscriptions.platform` are readable to `auth.uid() = id|user_id` only.
  - Do NOT write rollback migrations this sprint — rollback notes live in the migration file header per §8.

- **build-engineer:**
  - Read this doc end-to-end. Three batches per §9. Each batch waits on the previous; batches 2 and 3 wait on build-data.
  - Every native plugin call sits behind `Capacitor.isNativePlatform()` — no exceptions (per §1 risk 1).
  - `google-services.json` placeholder ONLY — do NOT commit a real Firebase config file. If Anton drops one locally for testing, gitignore it (§3).
  - Conversational Filipino copy is locked per §2/§3/§4 — do not rewrite without ux-designer review.
  - Bundle-size sanity check after each batch: `ls -lh frontend/android/app/build/outputs/{bundle/debug,apk/debug}/*.{aab,apk}` — fail batch and flag if either crosses 22 MB.

- **build-qa:**
  - Bundle-size growth target: `.aab` + `.apk` both must stay under 22 MB ceiling (was 14.62 / 15.35 MB Sprint 15; ~7 MB headroom for 3 plugins + Sentry native SDK).
  - Plugin-mock test pattern required: every test that touches a Capacitor plugin must mock `Capacitor.isNativePlatform()` (default `false` for existing tests; `true` for new native-path tests). Reuse the `vi.mock('@capacitor/core', …)` pattern.
  - Full vitest suite must pass with **1331+ baseline** (Sprint 15 close-out). New tests this sprint: native-path branches for camera-capture, capacitor-push register, biometric overlay state machine, deep-link URL parser. Estimate +30-50 tests.
  - Smoke matrix: web build (Vercel target, no `CAPACITOR_BUILD`) MUST still build and pass all current tests. Capacitor build must produce installable `.apk` (debug-signed; release-signing is Sprint 19).
  - Update bundle-size guard test ceiling to 22 MB per §9 final smoke.

- **build-ux:**
  - 3 permission prompt copy reviews (camera, push, biometric) per §2/§3/§4. Verify VSO syntax + second-position enclitics + no English SVO.
  - Onboarding step 6.25 visual treatment — design must match existing OnboardingShell rhythm (Kai expression + tilt + prompt). Recommend `expression: 'thinking'`, `tilt: 'right'` (continuing the 5-step alternation).
  - Biometric denial / fallback overlay states — propose visual treatment for `BiometricOverlay` (status: `verifying` + `failed` + counter display).
  - `(app)/deadlines` deferred-prompt copy + visual treatment (banner-in-page vs modal).

- **review-security:**
  - 4 audit surfaces per §7: camera permission flow, push consent NPC compliance, biometric implementation, PKCE carry-over from Sprint 15.
  - PKCE audit is the one that MIGHT find a bug. If `exchangeCodeForSession` fails inside Capacitor's localStorage sandbox, the fix is a `@capacitor/preferences`-backed Supabase storage adapter — recommend the engineer ships that in a follow-up commit on the same branch if review-security verifies the bug exists.

- **build-ai:** skip (no prompt changes this sprint).
- **build-marketing:** skip (no GTM/waitlist/content changes).
