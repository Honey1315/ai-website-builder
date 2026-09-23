/**
 * Simple sliding-window in-memory rate limiter.
 *
 * Works well for single-instance deployments (local dev, single Vercel serverless region).
 * For multi-region/multi-instance deployments, replace the Map with a Redis/Upstash store.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Module-level store - shared across all requests in the same process.
const store = new Map<string, RateLimitEntry>();

// Periodically sweep expired entries to prevent unbounded memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window */
  remaining: number;
  /** Unix ms timestamp when the window resets */
  resetAt: number;
}

/**
 * Check and increment the rate limit for a given key.
 *
 * @param key      Unique identifier - typically `userId:routeName`
 * @param limit    Maximum requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No entry or window has expired - start a fresh window
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  // Within the window - check against limit
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
