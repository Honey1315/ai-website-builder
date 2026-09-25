import { wrapOpenAI } from "langsmith/wrappers";
import { traceable } from "langsmith/traceable";

export function isLangSmithEnabled(): boolean {
  return (
    process.env.LANGSMITH_TRACING === "true" &&
    typeof process.env.LANGSMITH_API_KEY === "string" &&
    process.env.LANGSMITH_API_KEY.trim().length > 0
  );
}

export function wrapOpenAIClient<T extends object>(client: T): T {
  if (!isLangSmithEnabled()) {
    return client;
  }
  try {
    return wrapOpenAI(client as any) as unknown as T;
  } catch (err) {
    console.warn("[LangSmith] Failed to wrap OpenAI client, falling back to raw client:", err);
    return client;
  }
}

export function safeTraceable<F extends (...args: any[]) => any>(
  fn: F,
  options?: { name?: string; run_type?: "llm" | "chain" | "tool" | "parser" }
): F {
  if (!isLangSmithEnabled()) {
    return fn;
  }
  try {
    return traceable(fn, {
      name: options?.name || fn.name || "unnamed_operation",
      run_type: options?.run_type || "chain",
      project_name: process.env.LANGSMITH_PROJECT || "ai-website-builder",
    }) as unknown as F;
  } catch (err) {
    console.warn(`[LangSmith] Failed to instrument function "${options?.name || fn.name}":`, err);
    return fn;
  }
}
