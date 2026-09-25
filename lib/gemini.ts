import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { ChatMessage } from "@/lib/openrouter";
import { isModelHealthy, tripModel } from "@/lib/circuitBreaker";
import { MODEL_CATALOG } from "@/utils/constants";
import { withTimeout } from "@/lib/timeout";
import { safeTraceable } from "@/lib/langsmith";

function getGeminiModels(): string[] {
  return MODEL_CATALOG.gemini.models;
}

function getGeminiDefaultModel(): string {
  return MODEL_CATALOG.gemini.defaultModel;
}

let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set - add it to .env.local and restart the dev server");
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function convertToGeminiHistory(
  messages: ChatMessage[]
): { role: "user" | "model"; parts: { text: string }[] }[] {
  const systemParts: string[] = [];
  const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(msg.content);
    } else if (msg.role === "user") {
      const text = systemParts.length > 0
        ? `${systemParts.join("\n\n")}\n\n${msg.content}`
        : msg.content;
      systemParts.length = 0;
      history.push({ role: "user", parts: [{ text }] });
    } else if (msg.role === "assistant") {
      history.push({ role: "model", parts: [{ text: msg.content }] });
    }
  }

  return history;
}

async function executeGeminiCall(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const temperature = options.temperature ?? 0.1;
  const maxOutputTokens = options.maxTokens ?? 8192;

  const catalog = MODEL_CATALOG.gemini;
  const preferredModel =
    options.model && catalog.models.includes(options.model)
      ? options.model
      : catalog.defaultModel;

  const fallbackModels = catalog.models
    .filter((m) => m !== preferredModel)
    .filter(isModelHealthy);

  const modelsToTry = [preferredModel, ...fallbackModels];

  let lastError: unknown;

  for (const modelId of modelsToTry) {
    try {
      console.info(`[Gemini] Calling model "${modelId}"...`);
      const client = getGeminiClient();
      const model = client.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature,
          maxOutputTokens,
          topP: 0.95,
          candidateCount: 1,
        },
      });

      const history = convertToGeminiHistory(messages);
      if (history.length === 0) {
        throw new Error("No messages to send to Gemini");
      }
      const lastMsg = history[history.length - 1];
      const priorHistory = history.slice(0, -1);

      let result: string;

      if (priorHistory.length === 0) {
        const response = await withTimeout(
          model.generateContent(lastMsg.parts[0].text),
          35000,
          `Gemini model "${modelId}" timed out after 35s`
        );
        result = response.response.text();
      } else {
        const chat = model.startChat({ history: priorHistory });
        const response = await withTimeout(
          chat.sendMessage(lastMsg.parts[0].text),
          35000,
          `Gemini model "${modelId}" timed out after 35s`
        );
        result = response.response.text();
      }

      if (!result || result.trim() === "") {
        console.warn(`[Gemini] Model "${modelId}" returned empty response. Tripping.`);
        tripModel(modelId);
        continue;
      }

      return result;
    } catch (err: any) {
      console.warn(`[Gemini] Model "${modelId}" failed:`, err?.message || err);
      if (
        err?.status === 429 ||
        err?.status === 503 ||
        err?.message?.includes("quota") ||
        err?.message?.includes("timed out")
      ) {
        tripModel(modelId, err);
      }

      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed or are in cooldown");
}

export const callGemini = safeTraceable(executeGeminiCall, {
  name: "Google Gemini Inference",
  run_type: "llm",
});

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export const GEMINI_MODELS = MODEL_CATALOG.gemini.models;

