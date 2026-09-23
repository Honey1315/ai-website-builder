import type { ModelProvider } from "@/types/ai";

export const MODELS = {
  OPENROUTER_LAGUNA_FREE: "poolside/laguna-m.1:free",
  OPENROUTER_QWEN_FREE: "qwen/qwen3-next-80b-a3b-instruct:free",
  OPENROUTER_LLAMA_3_3_FREE: "meta-llama/llama-3.3-70b-instruct:free",
  OPENROUTER_QWEN_CODER_FREE: "qwen/qwen-2.5-coder-32b-instruct:free",
};

export interface ModelCatalogEntry {
  label: string;
  models: string[];
  defaultModel: string;
}

export const MODEL_CATALOG: Record<ModelProvider, ModelCatalogEntry> = {
  gemini: {
    label: "Google Gemini",
    models: [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-latest",
    ],
    defaultModel: "gemini-3.6-flash",
  },
  openrouter: {
    label: "OpenRouter",
    models: [
      "inclusionai/ling-3.0-flash-vl:free",
      "z-ai/glm-5.2:free",
      "qwen/qwen3.8-27b:free",
      "poolside/laguna-xs-2.1:free",
      "poolside/laguna-s-2.1:free",
      "thinkingmachines/inkling:free"
    ],
    defaultModel: "inclusionai/ling-3.0-flash-vl:free",
  },
  nvidia: {
    label: "NVIDIA",
    models: [
      "poolside/laguna-xs-2.1",
      "nvidia/nemotron-3-super-120b-a12b",
      "nvidia/nemotron-3-ultra-550b-a55b",
    ],
    defaultModel: "poolside/laguna-xs-2.1",
  },
};

// Default provider: Gemini (primary) -> OpenRouter -> NVIDIA
export const DEFAULT_MODEL_PROVIDER: ModelProvider = "gemini";

export const API_ENDPOINTS = {
  GENERATE: "/api/generate",
  REFINE: "/api/refine",
  EXPORT: "/api/export",
  SAVE_PROJECT: "/api/project/save",
  GET_PROJECT: "/api/project/get",
};

export const DEFAULT_PROMPT_TEMPLATE = `Create a full fledged working React App ready for deployment based on this description:
{prompt}

Return ONLY valid JSX/React code that can be rendered and if one file contains large number of code give multiple files. No explanations.`;

export const FILE_EXTENSIONS = {
  jsx: "javascript",
  tsx: "typescript",
  js: "javascript",
  ts: "typescript",
  css: "css",
  html: "html",
  json: "json",
};
