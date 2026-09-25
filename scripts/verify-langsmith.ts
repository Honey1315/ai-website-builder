import { isLangSmithEnabled, safeTraceable } from "../lib/langsmith";

async function runDiagnostics() {
  console.log("=== LangSmith Configuration Diagnostics ===");
  console.log(`LANGSMITH_TRACING: ${process.env.LANGSMITH_TRACING || "unset"}`);
  console.log(`LANGSMITH_PROJECT: ${process.env.LANGSMITH_PROJECT || "default"}`);
  console.log(`LANGSMITH_API_KEY: ${process.env.LANGSMITH_API_KEY ? "configured (hidden)" : "unset"}`);
  console.log(`Tracing Enabled: ${isLangSmithEnabled() ? "YES" : "NO (Clean Fallback Mode)"}`);

  const testOperation = safeTraceable(
    async (task: string) => {
      return `Successfully executed operation: ${task}`;
    },
    { name: "diagnostic_test_run", run_type: "tool" }
  );

  const output = await testOperation("Verification Check");
  console.log(`Execution Output: ${output}`);
  console.log("Diagnostics finished without errors.");
}

runDiagnostics().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
