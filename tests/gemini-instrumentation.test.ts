import test from "node:test";
import assert from "node:assert/strict";
import { isGeminiAvailable, callGemini } from "../lib/gemini";

test("isGeminiAvailable returns boolean based on environment variable", () => {
  const original = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test_key";
  assert.equal(isGeminiAvailable(), true);

  delete process.env.GEMINI_API_KEY;
  assert.equal(isGeminiAvailable(), false);
  process.env.GEMINI_API_KEY = original;
});

test("callGemini is a function and callable", () => {
  assert.equal(typeof callGemini, "function");
});
