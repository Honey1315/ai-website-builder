import OpenAI from "openai";

import type { ModelProvider, ProviderOptions } from "@/types/ai";
import { MODEL_CATALOG } from "@/utils/constants";

export type { ModelProvider, ProviderOptions } from "@/types/ai";

export const DEFAULT_NVIDIA_MODEL = MODEL_CATALOG.nvidia.defaultModel;
export const MICROSOFT_PHI_INSTRUCT_MODEL = "microsoft/phi-4-mini-instruct";
export const QWEN_QWEN3_NEXT_80B_A3B_INSTRUCT_MODEL = "qwen/qwen3-next-80b-a3b-instruct";
export const OPENAI_GPT_OSS_120B_MODEL = "openai/gpt-oss-120b";
export const  STEALTH_OX_ALPHA="stealth/ox-alpha";

// Read lazily so env vars added after the server booted are still picked up.
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
    model: OPENAI_GPT_OSS_120B_MODEL,
    temperature: 0.7,
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
    });
  }
  return openRouterClient;
}

/**
 * Validates raw provider/model input coming from API request bodies.
 * Falls back to the default provider when the value is unknown.
 */
export function resolveProviderOptions(input: {
  provider?: unknown;
  model?: unknown;
}): ProviderOptions {
  const provider: ModelProvider =
    input.provider === "openrouter" || input.provider === "nvidia"
      ? input.provider
      : "nvidia";

  return {
    provider,
    model:
      typeof input.model === "string" && input.model.trim().length > 0
        ? input.model
        : undefined,
  };
}

type ChatMessage = { role: "user"; content: string };

export async function callOpenRouter(
  messages: ChatMessage[],
  options: ProviderOptions = {}
): Promise<string> {
  if (options.provider === "openrouter") {
    if (!getOpenRouterApiKey()) {
      throw new Error(
        "OPENROUTER_API_KEY is not set — add it to .env.local and restart the dev server"
      );
    }

    const response = await getOpenRouterClient().chat.completions.create({
      model: options.model || MODEL_CATALOG.openrouter.defaultModel,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false,
    });

    return response.choices[0].message.content || "";
  }

  const config = getNVIDIAConfig();

  const response = await getNvidiaClient().chat.completions.create({
    model: options.model || config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.top_p,
    stream: false,
  });

  return response.choices[0].message.content || "";
}
