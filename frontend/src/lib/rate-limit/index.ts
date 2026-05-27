// AKBai — In-memory sliding window rate limiter
// Phase 0-1 solution. Replace with Cloudflare WAF when migrating to Cloudflare Pages (Month 7+).

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

interface WindowEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, WindowEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 10_000; // DDoS safety valve

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;

  // Hard cap: if store is suspiciously large, clear entirely
  if (store.size > MAX_ENTRIES) {
    store.clear();
    return;
  }

  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();

  cleanup(config.windowMs);

  const entry = store.get(key);

  // No entry or window expired — start fresh
  if (!entry || now - entry.windowStart > config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  // Within window — check limit
  if (entry.count >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  // Increment
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count };
}

// Exported for testing only
export function _resetStore(): void {
  store.clear();
  lastCleanup = Date.now();
}
