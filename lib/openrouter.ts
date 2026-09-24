import OpenAI from "openai";
import type { ModelProvider, ProviderOptions } from "@/types/ai";
import { MODEL_CATALOG } from "@/utils/constants";
import { isModelHealthy, tripModel, getUnhealthyModels } from "@/lib/circuitBreaker";
import { withTimeout } from "@/lib/timeout";

export type { ModelProvider, ProviderOptions } from "@/types/ai";

export const DEFAULT_NVIDIA_MODEL = MODEL_CATALOG.nvidia.defaultModel;

const getNvidiaApiKey = () => process.env.NVIDIA_API_KEY;
const getOpenRouterApiKey = () => process.env.OPENROUTER_API_KEY;

export interface NVIDIAConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  top_p?: number;
}

export const getNVIDIAConfig = (): NVIDIAConfig => {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not set");
  }
  return {
    apiKey,
    model: DEFAULT_NVIDIA_MODEL,
    temperature: 0.1,
    maxTokens: 4096,
    top_p: 0.95,
  };
};

let nvidiaClient: OpenAI | null = null;
function getNvidiaClient(): OpenAI {
  if (!nvidiaClient) {
    nvidiaClient = new OpenAI({
      apiKey: getNvidiaApiKey() || "",
      baseURL: "https://integrate.api.nvidia.com/v1",
      timeout: 35000,
      maxRetries: 0,
    });
  }
  return nvidiaClient;
}

let openRouterClient: OpenAI | null = null;
function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    openRouterClient = new OpenAI({
      apiKey: getOpenRouterApiKey() || "",
      baseURL: "https://openrouter.ai/api/v1",
      timeout: 35000,
      maxRetries: 0,
    });
  }
  return openRouterClient;
}

/**
 * Validates raw provider/model input coming from API request bodies.
 * Restricts models to the valid catalog and falls back to defaultModel.
 */
export function resolveProviderOptions(input: {
  provider?: unknown;
  model?: unknown;
}): ProviderOptions {
  const provider: ModelProvider =
    input.provider === "openrouter" || input.provider === "nvidia" || input.provider === "gemini"
      ? input.provider
      : process.env.GEMINI_API_KEY ? "gemini" : "openrouter";

  const catalog = MODEL_CATALOG[provider];
  const requestedModel =
    typeof input.model === "string" && input.model.trim().length > 0
      ? input.model.trim()
      : undefined;

  const model =
    requestedModel && catalog.models.includes(requestedModel)
      ? requestedModel
      : catalog.defaultModel;

  return {
    provider,
    model,
  };
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * Resolves the ordered candidate models for a provider, filtered against active
 * circuit-breaker cooldown windows.
 *
 * Emergency fallback: if every model is in cooldown, selects the one closest
 * to recovery so the pipeline never dead-ends with an empty list.
 */
export function resolveHealthyCandidates(
  provider: ModelProvider,
  preferredModel?: string
): string[] {
  const catalog = MODEL_CATALOG[provider];
  const primary =
    preferredModel && catalog.models.includes(preferredModel)
      ? preferredModel
      : catalog.defaultModel;

  const ordered = [primary, ...catalog.models.filter((m) => m !== primary)];
  const healthy = ordered.filter(isModelHealthy);

  if (healthy.length > 0) return healthy;

  const unhealthy = getUnhealthyModels().filter(({ modelId }) =>
    catalog.models.includes(modelId)
  );

  const emergency =
    unhealthy.length > 0
      ? unhealthy.sort((a, b) => a.remainingMs - b.remainingMs)[0].modelId
      : primary;

  console.warn(
    `[OpenRouter] All ${provider} models are in cooldown. Emergency fallback to "${emergency}".`
  );
  return [emergency];
}

/**
 * Safely extracts text content from an OpenAI-compatible completion response.
 * Returns null if the payload is empty or malformed.
 */
export function extractResponseContent(
  response: OpenAI.Chat.ChatCompletion,
  modelId: string
): string | null {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    console.warn(`[OpenRouter] Model "${modelId}" returned an empty or malformed payload.`);
    return null;
  }
  return content;
}

/**
 * Core unified AI call function:
 * 1. Filters candidates through the in-memory circuit breaker.
 * 2. Leverages OpenRouter native models edge-gateway routing in a single HTTP call.
 * 3. Safely extracts response content and trips circuit breaker on empty payload or errors.
 * 4. Falls back to sequential iteration for NVIDIA NIM.
 */
export async function callOpenRouter(
  messages: ChatMessage[],
  options: ProviderOptions = {}
): Promise<string> {
  const provider = options.provider || "openrouter";
  const temperature = options.temperature ?? 0.1;
  const candidates = resolveHealthyCandidates(provider, options.model);

  if (provider === "openrouter") {
    if (!getOpenRouterApiKey()) {
      throw new Error("OPENROUTER_API_KEY is not set - add it to .env.local and restart the dev server");
    }

    const [primary, ...fallbacks] = candidates;

    try {
      const requestPayload: any = {
        model: primary,
        messages,
        temperature,
        max_tokens: 8192,
        top_p: 0.95,
        stream: false,
      };

      if (fallbacks.length > 0) {
        requestPayload.models = [primary, ...fallbacks].slice(0, 3);
        requestPayload.provider = { allow_fallbacks: true };
      }

      const response = await withTimeout(
        getOpenRouterClient().chat.completions.create(requestPayload),
        35000,
        `OpenRouter request for "${primary}" timed out after 35s`
      );

      const servedBy: string = (response as any)?.model || primary;
      if (servedBy !== primary) {
        console.info(
          `[OpenRouter] Primary model "${primary}" failed upstream; served by fallback "${servedBy}". Tripping primary.`
        );
        tripModel(primary);
      }

      const content = extractResponseContent(response, servedBy);
      if (content === null) {
        tripModel(servedBy);
        return await openRouterFallbackLoop(
          messages,
          temperature,
          candidates.filter((m) => m !== servedBy)
        );
      }

      return content;
    } catch (err: any) {
      console.warn(`[OpenRouter] Gateway request failed for "${primary}":`, err?.message || err);
      tripModel(primary, err);

      const remaining = candidates.slice(1).filter(isModelHealthy);
      if (remaining.length > 0) {
        return await openRouterFallbackLoop(messages, temperature, remaining);
      }

      throw err;
    }
  }

  const config = getNVIDIAConfig();
  let lastError: unknown;

  for (const candidate of candidates) {
    if (!isModelHealthy(candidate)) continue;

    try {
      const response = await withTimeout(
        getNvidiaClient().chat.completions.create({
          model: candidate,
          messages,
          temperature,
          max_tokens: config.maxTokens,
          top_p: config.top_p,
          stream: false,
        }),
        35000,
        `NVIDIA request for "${candidate}" timed out after 35s`
      );

      const content = extractResponseContent(response, candidate);
      if (content === null) {
        tripModel(candidate);
        continue;
      }

      return content;
    } catch (err) {
      console.warn(`[NVIDIA] Model "${candidate}" failed:`, err);
      tripModel(candidate, err);
      lastError = err;
    }
  }

  throw lastError || new Error("All NVIDIA models failed or are currently in cooldown");
}

async function openRouterFallbackLoop(
  messages: ChatMessage[],
  temperature: number,
  candidates: string[]
): Promise<string> {
  let lastError: unknown;

  for (const candidate of candidates) {
    if (!isModelHealthy(candidate)) continue;

    try {
      const response = await withTimeout(
        getOpenRouterClient().chat.completions.create({
          model: candidate,
          messages,
          temperature,
          max_tokens: 8192,
          top_p: 0.95,
          stream: false,
        }),
        35000,
        `OpenRouter fallback request for "${candidate}" timed out after 35s`
      );

      const content = extractResponseContent(response, candidate);
      if (content === null) {
        tripModel(candidate);
        continue;
      }

      return content;
    } catch (err) {
      console.warn(`[OpenRouter] Fallback model "${candidate}" failed:`, err);
      tripModel(candidate, err);
      lastError = err;
    }
  }

  throw lastError || new Error("All OpenRouter fallback models exhausted or in cooldown");
}