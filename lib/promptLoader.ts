import { createRequire } from "module";
import { formatPrompt } from "@/lib/promptUtils";

export interface PromptModule {
  SYSTEM_PROMPT: string;
  GENERATE_STRUCTURE_PROMPT_TEMPLATE: string;
  GENERATE_MANIFEST_PROMPT_TEMPLATE: string;
  GENERATE_FILE_PROMPT_TEMPLATE: string;
  GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE: string;
  FIX_CONTRACT_FILE_PROMPT_TEMPLATE: string;
  VALIDATE_FILE_PROMPT_TEMPLATE: string;
  GENERATE_FILE_SUMMARY_PROMPT_TEMPLATE: string;
  REFINE_PROMPT_TEMPLATE: string;
  PROJECT_REVIEW_PROMPT_TEMPLATE: string;
}

const require = createRequire(import.meta.url);

let cachedPrompts: PromptModule | null = null;

export function getPrompts(): PromptModule {
  if (!cachedPrompts) {
    cachedPrompts = require("./prompts") as PromptModule;
  }

  return cachedPrompts;
}

export { formatPrompt };
