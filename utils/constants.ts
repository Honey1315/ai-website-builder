export const MODELS = {
  OPENROUTER_LAGUNA_FREE: "poolside/laguna-m.1:free",
  OPENROUTER_QWEN_FREE: "qwen/qwen3-next-80b-a3b-instruct:free"
};

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
