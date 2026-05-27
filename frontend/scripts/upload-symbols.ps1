# ============================================================
# upload-symbols.ps1 — Sentry symbolication upload (Windows host)
#
# Feature: Native Crash Symbolication Pipeline (Sprint 16)
# Sprint 16 status: CONFIGURED. Sprint 19 status: EXECUTED.
#
# Purpose:
#   Uploads the Android ProGuard mapping file (mapping.txt) to Sentry
#   so native crash stack traces are symbolicated server-side. iOS
#   dSYM upload is a no-op on Windows (no Xcode) — runs on Sprint 19
#   Mac via the .sh companion script.
#
# Prereqs (Sprint 19, NOT Sprint 16):
#   - sentry-cli installed and on PATH
#       (npm i -g @sentry/cli  OR  https://docs.sentry.io/cli/)
#   - SENTRY_AUTH_TOKEN env var set (Sentry → Account → API tokens)
#   - SENTRY_ORG + SENTRY_PROJECT env vars set
#   - A release-signed bundle has been built (./gradlew assembleRelease
#     or bundleRelease) so mapping.txt exists.
#
# Sprint 16 behaviour:
#   No SENTRY_AUTH_TOKEN → script exits 0 with a friendly message.
#   This is INTENTIONAL — see architect §6 risk #5: symbolication
#   pipeline is configured here, exercised in Sprint 19.
#
# Corporate-TLS note (per SPIKE_FINDINGS.md §Toolchain install):
#   sentry-cli uses native-tls/rustls, not the JDK keystore. If it
#   hits a handshake error on corporate-proxied networks, try the
#   --insecure flag (debug only) OR set SENTRY_HTTP_PROXY=$env:HTTP_PROXY.
#   The cacerts21 keystore patch from Sprint 15 does NOT help here.
#
# Usage:
#   pwsh scripts/upload-symbols.ps1 -Release "akbai-android@1.0.0"
#
# Architect reference: sprint-16-native-plugin-pattern.md §6.
# ============================================================

param(
    [Parameter(Mandatory=$false)][string]$Release = "akbai-android@dev"
)

$ErrorActionPreference = 'Stop'

if (-not $env:SENTRY_AUTH_TOKEN) {
    Write-Host "SENTRY_AUTH_TOKEN not set — skipping symbol upload."
    Write-Host "This is expected behaviour for Sprint 16; Sprint 19 wires the CI secret."
    exit 0
}

if (-not $env:SENTRY_ORG -or -not $env:SENTRY_PROJECT) {
    Write-Host "SENTRY_ORG or SENTRY_PROJECT not set — cannot upload."
    Write-Host "Set both env vars before running this script (Sprint 19 task)."
    exit 0
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$mappingFile = Join-Path $repoRoot "android/app/build/outputs/mapping/release/mapping.txt"

if (-not (Test-Path $mappingFile)) {
    Write-Host "No ProGuard mapping at $mappingFile."
    Write-Host "Did you run ./gradlew assembleRelease or bundleRelease first?"
    Write-Host "Skipping (debug builds don't produce a mapping file)."
    exit 0
}

Write-Host "Uploading ProGuard mapping $mappingFile for release $Release"
& sentry-cli upload-dif `
    --type proguard `
    --org $env:SENTRY_ORG `
    --project $env:SENTRY_PROJECT `
    $mappingFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "sentry-cli upload-dif failed (exit $LASTEXITCODE)."
    exit $LASTEXITCODE
}

Write-Host "Done. Symbols uploaded for release $Release."

# ============================================================
# iOS dSYM upload — Sprint 19+ on a Mac host. Windows skips.
# The .sh companion at scripts/upload-symbols.sh covers Mac.
# ============================================================
