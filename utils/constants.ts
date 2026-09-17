import type { ModelProvider } from "@/types/ai";

export const MODELS = {
  OPENROUTER_LAGUNA_FREE: "poolside/laguna-m.1:free",
  OPENROUTER_QWEN_FREE: "qwen/qwen3-next-80b-a3b-instruct:free"
};

export interface ModelCatalogEntry {
  label: string;
  models: string[];
  defaultModel: string;
}

export const MODEL_CATALOG: Record<ModelProvider, ModelCatalogEntry> = {
  nvidia: {
    label: "NVIDIA",
    models: [
      "openai/gpt-oss-120b",
      "nvidia/nemotron-3-super-120b-a12b",
      "qwen/qwen3-next-80b-a3b-instruct",
      "microsoft/phi-4-mini-instruct",
    ],
    defaultModel: "openai/gpt-oss-120b",
  },
  openrouter: {
    label: "OpenRouter",
    models: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct",
      "poolside/laguna-m.1:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "stealth/ox-alpha",
    ],
    defaultModel: "stealth/ox-alpha",
  },
};

export const DEFAULT_MODEL_PROVIDER: ModelProvider = "nvidia";

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
