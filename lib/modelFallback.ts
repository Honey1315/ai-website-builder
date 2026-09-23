import { callOpenRouter, type ChatMessage } from "@/lib/openrouter";
import { callGemini, isGeminiAvailable } from "@/lib/gemini";
import type { ProviderOptions, ModelProvider } from "@/types/ai";
import { getUnhealthyModels } from "@/lib/circuitBreaker";
import { MODEL_CATALOG } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Retry Configuration & Helper
// ---------------------------------------------------------------------------

export interface RetryConfig {
  /** Milliseconds to wait before the first retry. Doubles on each attempt. */
  retryDelay: number;
  /** Total number of attempts (1 = no retries). */
  maxRetries: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retryDelay: 1000,
  maxRetries: 3,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries `callFn` up to `config.maxRetries` times with exponential back-off.
 */
export async function callWithRetry<T>(
  callFn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      return await callFn();
    } catch (error) {
      console.warn(`[Retry] Attempt ${attempt + 1} failed:`, error);
      lastError = error;

      if (attempt < finalConfig.maxRetries - 1) {
        await delay(finalConfig.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError ?? new Error("Max retries exhausted");
}

// ---------------------------------------------------------------------------
// Multi-Provider Fallback Pipeline
// ---------------------------------------------------------------------------

// Priority order: Gemini (primary, 1500 req/day free) -> OpenRouter -> NVIDIA
const PROVIDER_PRIORITY: ModelProvider[] = ["gemini", "openrouter", "nvidia"];

/**
 * Calls AI with multi-provider fallback:
 * Automatically fails over to the secondary provider tier if the active provider
 * is completely exhausted, rate-limited (429), or unavailable (503).
 */
export async function callWithProviderFallback(
  messages: ChatMessage[],
  options: ProviderOptions = {}
): Promise<string> {
  // Default to gemini if no explicit provider is set and key is available
  const preferredProvider: ModelProvider =
    options.provider || (isGeminiAvailable() ? "gemini" : "openrouter");

  const orderedProviders: ModelProvider[] = [
    preferredProvider,
    ...PROVIDER_PRIORITY.filter((p) => p !== preferredProvider),
  ];

  let lastError: unknown;

  for (const provider of orderedProviders) {
    // Gate: skip if API key is absent
    if (provider === "gemini" && !isGeminiAvailable()) {
      console.info("[ModelFallback] Skipping Gemini: GEMINI_API_KEY not set.");
      continue;
    }
    if (provider === "nvidia" && !process.env.NVIDIA_API_KEY) {
      console.info("[ModelFallback] Skipping NVIDIA: NVIDIA_API_KEY not set.");
      continue;
    }
    if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
      console.info("[ModelFallback] Skipping OpenRouter: OPENROUTER_API_KEY not set.");
      continue;
    }

    try {
      if (provider === "gemini") {
        console.info(`[ModelFallback] Calling Gemini (${options.model || "default"}).`);
        return await callGemini(messages, {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          model: options.model,
        });
      }

      return await callOpenRouter(messages, {
        ...options,
        provider,
      });
    } catch (err) {
      console.warn(`[ModelFallback] Provider "${provider}" exhausted/failed:`, err);
      lastError = err;
    }
  }

  // If all providers failed, construct a helpful diagnostic message
  const unhealthy = getUnhealthyModels();
  const unhealthyList = unhealthy
    .map(({ modelId, remainingSeconds }) => `${modelId} (${remainingSeconds}s cooldown)`)
    .join(", ");

  throw new Error(
    `All AI providers are currently unavailable. ${
      unhealthyList ? `Tripped models: [${unhealthyList}]. ` : ""
    }Please check provider quotas or retry in a few minutes.`
  );
}

// ---------------------------------------------------------------------------
// Fast Utility Model Route
// ---------------------------------------------------------------------------

/**
 * Calls a lightweight, fast model for metadata extraction, file selection, or summaries.
 * Avoids running through heavy code generation queues or exhausting main coder quotas.
 */
export async function callFastUtilityModel(
  messages: ChatMessage[],
  options: ProviderOptions = {}
): Promise<string> {
  // Utility calls route through OpenRouter first (free, fast models), falling back to secondary if needed
  return callWithProviderFallback(messages, {
    ...options,
    provider: options.provider || "openrouter",
    temperature: options.temperature ?? 0.1,
  });
}

// ---------------------------------------------------------------------------
// Health Summary (for monitoring / status inspection)
// ---------------------------------------------------------------------------

export function modelHealthSummary(): {
  healthy: string[];
  unhealthy: Array<{ modelId: string; remainingMs: number }>;
} {
  const allModels = [
    ...MODEL_CATALOG.gemini.models,
    ...MODEL_CATALOG.openrouter.models,
    ...MODEL_CATALOG.nvidia.models,
  ];

  const unhealthy = getUnhealthyModels();
  const unhealthyIds = new Set(unhealthy.map((u) => u.modelId));

  return {
    healthy: allModels.filter((m) => !unhealthyIds.has(m)),
    unhealthy,
  };
}