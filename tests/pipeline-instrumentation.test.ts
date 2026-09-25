import test from "node:test";
import assert from "node:assert/strict";
import { AIService } from "../services/ai.service";

test("AIService static methods exist and have valid function signatures", () => {
  assert.equal(typeof AIService.generateStructure, "function");
  assert.equal(typeof AIService.generateManifest, "function");
  assert.equal(typeof AIService.generateProjectFile, "function");
  assert.equal(typeof AIService.autoFixFiles, "function");
});
