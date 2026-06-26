import OpenAI from "openai";

export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

export const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-super-120b-a12b";
export const MICROSOFT_PHI_INSTRUCT_MODEL = "microsoft/phi-4-mini-instruct";
export const QWEN_QWEN3_NEXT_80B_A3B_INSTRUCT_MODEL = "qwen/qwen3-next-80b-a3b-instruct";
export const OPENAI_GPT_OSS_120B_MODEL = "openai/gpt-oss-120b";
export interface NVIDIAConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  top_p?: number;
}

export const getNVIDIAConfig = (): NVIDIAConfig => {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY is not set");
  }

  return {
    apiKey: NVIDIA_API_KEY,
    model: OPENAI_GPT_OSS_120B_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
    top_p: 0.95,
  };
};

const nvidia = new OpenAI({
  apiKey: NVIDIA_API_KEY || "",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function callOpenRouter(
  messages: { role: "user"; content: string }[]
): Promise<string> {
  const config = getNVIDIAConfig();

  const response = await nvidia.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.top_p,
    stream: false,
  });

  return response.choices[0].message.content || "";
}