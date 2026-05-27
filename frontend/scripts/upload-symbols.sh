#!/usr/bin/env bash
# ============================================================
# upload-symbols.sh — Sentry symbolication upload (Mac/Linux)
#
# Feature: Native Crash Symbolication Pipeline (Sprint 16)
# Sprint 16 status: CONFIGURED (stub). Sprint 19 status: EXECUTED.
#
# Purpose:
#   Uploads the Android ProGuard mapping file (mapping.txt) AND the
#   iOS dSYM debug-info archive to Sentry so native crash stack
#   traces are symbolicated server-side.
#
# Prereqs (Sprint 19, NOT Sprint 16):
#   - sentry-cli installed and on PATH
#       (npm i -g @sentry/cli  OR  https://docs.sentry.io/cli/)
#   - SENTRY_AUTH_TOKEN env var set
#   - SENTRY_ORG + SENTRY_PROJECT env vars set
#   - For iOS: a release Xcode Archive has been produced so the
#     dSYM artifacts exist under build/AKBai.xcarchive/dSYMs/
#
# Sprint 16 behaviour:
#   No SENTRY_AUTH_TOKEN → script exits 0 with a friendly message.
#
# Usage:
#   ./scripts/upload-symbols.sh akbai-mobile@1.0.0
#
# Architect reference: sprint-16-native-plugin-pattern.md §6.
# ============================================================

set -euo pipefail

RELEASE="${1:-akbai-mobile@dev}"

if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "SENTRY_AUTH_TOKEN not set — skipping symbol upload."
  echo "This is expected behaviour for Sprint 16; Sprint 19 wires the CI secret."
  exit 0
fi

if [ -z "${SENTRY_ORG:-}" ] || [ -z "${SENTRY_PROJECT:-}" ]; then
  echo "SENTRY_ORG or SENTRY_PROJECT not set — cannot upload."
  echo "Set both env vars before running this script (Sprint 19 task)."
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Android ProGuard mapping ---
MAPPING_FILE="$REPO_ROOT/android/app/build/outputs/mapping/release/mapping.txt"
if [ -f "$MAPPING_FILE" ]; then
  echo "Uploading ProGuard mapping $MAPPING_FILE for release $RELEASE"
  sentry-cli upload-dif \
    --type proguard \
    --org "$SENTRY_ORG" \
    --project "$SENTRY_PROJECT" \
    "$MAPPING_FILE"
else
  echo "No ProGuard mapping at $MAPPING_FILE — skipping Android."
fi

# --- iOS dSYMs (Sprint 19+ on a Mac host) ---
if [ "$(uname)" = "Darwin" ]; then
  DSYM_DIR="$REPO_ROOT/ios/build"
  if [ -d "$DSYM_DIR" ]; then
    echo "Uploading iOS dSYMs from $DSYM_DIR for release $RELEASE"
    sentry-cli upload-dif \
      --org "$SENTRY_ORG" \
      --project "$SENTRY_PROJECT" \
      "$DSYM_DIR"
  else
    echo "No iOS build dir at $DSYM_DIR — skipping iOS."
  fi
else
  echo "Not on macOS — skipping iOS dSYM upload (run from Sprint 19 Mac)."
fi

echo "Done."
