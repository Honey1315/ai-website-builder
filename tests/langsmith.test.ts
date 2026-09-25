import test from "node:test";
import assert from "node:assert/strict";
import { isLangSmithEnabled, safeTraceable } from "@/lib/langsmith";

test("isLangSmithEnabled returns false when env variables are unset", () => {
  const originalTracing = process.env.LANGSMITH_TRACING;
  const originalKey = process.env.LANGSMITH_API_KEY;

  delete process.env.LANGSMITH_TRACING;
  delete process.env.LANGSMITH_API_KEY;

  assert.equal(isLangSmithEnabled(), false);

  process.env.LANGSMITH_TRACING = originalTracing;
  process.env.LANGSMITH_API_KEY = originalKey;
});

test("isLangSmithEnabled returns true when TRACING is true and API key is present", () => {
  const originalTracing = process.env.LANGSMITH_TRACING;
  const originalKey = process.env.LANGSMITH_API_KEY;

  process.env.LANGSMITH_TRACING = "true";
  process.env.LANGSMITH_API_KEY = "lsv2_test_key_123";

  assert.equal(isLangSmithEnabled(), true);

  process.env.LANGSMITH_TRACING = originalTracing;
  process.env.LANGSMITH_API_KEY = originalKey;
});

test("safeTraceable executes original function without error when tracing is disabled", async () => {
  const originalTracing = process.env.LANGSMITH_TRACING;
  delete process.env.LANGSMITH_TRACING;

  const mockFn = async (a: number, b: number) => a + b;
  const traced = safeTraceable(mockFn, { name: "test-addition" });

  const result = await traced(5, 7);
  assert.equal(result, 12);

  process.env.LANGSMITH_TRACING = originalTracing;
});
