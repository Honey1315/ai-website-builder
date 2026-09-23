/**
 * In-Memory Circuit Breaker for Model Resiliency & Cool-down Tracking
 *
 * Prevents repetitive requests against models returning 429 (rate-limited / shared pool overload),
 * 503 (upstream unavailable), or invalid/empty payloads.
 */

export interface UnhealthyModelInfo {
  modelId: string;
  remainingMs: number;
  remainingSeconds: number;
  expiresAt: Date;
}

// Map of modelId -> cooldown expiration timestamp (in milliseconds)
const cooldownMap = new Map<string, number>();

/** Default cooldown duration in seconds (5 minutes) */
export const DEFAULT_COOLDOWN_SECONDS = 300;

/**
 * Checks if a model is healthy (not currently in a cooldown window).
 * Automatically cleans up expired cooldown entries.
 */
export function isModelHealthy(modelId: string): boolean {
  if (!modelId) return false;
  const expiresAt = cooldownMap.get(modelId);
  if (!expiresAt) return true;

  const now = Date.now();
  if (now >= expiresAt) {
    cooldownMap.delete(modelId);
    return true;
  }

  return false;
}

/**
 * Parses retry-after duration (in seconds) from an error object or HTTP headers.
 */
function extractRetryAfterSeconds(error?: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const err = error as Record<string, any>;

  // 1. Direct numeric properties
  if (typeof err.retry_after_seconds === "number" && err.retry_after_seconds > 0) {
    return Math.ceil(err.retry_after_seconds);
  }
  if (typeof err.retry_after === "number" && err.retry_after > 0) {
    return Math.ceil(err.retry_after);
  }
  if (typeof err.retryAfter === "number" && err.retryAfter > 0) {
    return Math.ceil(err.retryAfter);
  }

  // 2. HTTP headers (e.g. OpenAI / Fetch Response)
  const headers = err.headers;
  let retryHeader: string | null = null;
  if (headers) {
    if (typeof headers.get === "function") {
      retryHeader = headers.get("retry-after") || headers.get("Retry-After");
    } else if (typeof headers === "object") {
      retryHeader = headers["retry-after"] || headers["Retry-After"];
    }
  }

  if (retryHeader) {
    const parsedSec = parseInt(retryHeader, 10);
    if (!isNaN(parsedSec) && parsedSec > 0) {
      return parsedSec;
    }
    const parsedDate = Date.parse(retryHeader);
    if (!isNaN(parsedDate)) {
      const diffSec = Math.ceil((parsedDate - Date.now()) / 1000);
      if (diffSec > 0) return diffSec;
    }
  }

  // 3. Inspect error message for retry duration phrases
  if (typeof err.message === "string") {
    const match =
      err.message.match(/retry(?:ing)? after (\d+) (?:seconds|s)/i) ||
      err.message.match(/retry in (\d+) (?:seconds|s)/i) ||
      err.message.match(/wait (\d+) (?:seconds|s)/i);
    if (match && match[1]) {
      const sec = parseInt(match[1], 10);
      if (!isNaN(sec) && sec > 0) return sec;
    }
  }

  return null;
}

/**
 * Trips the circuit breaker for a given model, placing it into a cooldown window.
 *
 * @param modelId - The model identifier (e.g. "z-ai/glm-5.2:free")
 * @param cooldownOrError - Explicit cooldown duration (in seconds) or the error that caused the trip
 * @param fallbackCooldown - Default cooldown duration if none extracted (defaults to 300s / 5 min)
 */
export function tripModel(
  modelId: string,
  cooldownOrError?: number | unknown,
  fallbackCooldown = DEFAULT_COOLDOWN_SECONDS
): void {
  if (!modelId) return;

  let cooldownSeconds = fallbackCooldown;

  if (typeof cooldownOrError === "number" && cooldownOrError > 0) {
    cooldownSeconds = cooldownOrError;
  } else if (cooldownOrError && typeof cooldownOrError === "object") {
    const extracted = extractRetryAfterSeconds(cooldownOrError);
    if (extracted && extracted > 0) {
      cooldownSeconds = extracted;
    }
  }

  const expiresAt = Date.now() + cooldownSeconds * 1000;
  cooldownMap.set(modelId, expiresAt);

  console.warn(
    `[CircuitBreaker] Tripped model "${modelId}" for ${cooldownSeconds}s (cools down at ${new Date(expiresAt).toLocaleTimeString()}).`
  );
}

/**
 * Returns remaining cooldown in milliseconds for a model, or 0 if healthy.
 */
export function getModelCooldownMs(modelId: string): number {
  const expiresAt = cooldownMap.get(modelId);
  if (!expiresAt) return 0;
  const now = Date.now();
  if (now >= expiresAt) {
    cooldownMap.delete(modelId);
    return 0;
  }
  return expiresAt - now;
}

/**
 * Returns all currently unhealthy models with their remaining cooldown time.
 */
export function getUnhealthyModels(): UnhealthyModelInfo[] {
  const now = Date.now();
  const list: UnhealthyModelInfo[] = [];

  for (const [modelId, expiresAt] of cooldownMap.entries()) {
    if (now >= expiresAt) {
      cooldownMap.delete(modelId);
    } else {
      const remainingMs = expiresAt - now;
      list.push({
        modelId,
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        expiresAt: new Date(expiresAt),
      });
    }
  }

  return list;
}

/**
 * Resets the circuit breaker state (useful for testing or administrative resets).
 */
export function resetCircuitBreaker(): void {
  cooldownMap.clear();
}