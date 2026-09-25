import test from "node:test";
import assert from "node:assert/strict";
import { resolveProviderOptions } from "../lib/openrouter";

test("resolveProviderOptions defaults correctly with tracing enabled", () => {
  const options = resolveProviderOptions({ provider: "openrouter" });
  assert.equal(options.provider, "openrouter");
  assert.ok(typeof options.model === "string");
});
