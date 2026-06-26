export function formatCode(code: string): string {
  // Basic code formatting
  let formatted = code.trim();

  // Remove markdown code blocks if present
  if (formatted.startsWith("```")) {
    formatted = formatted.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
  }

  // Normalize indentation
  const lines = formatted.split("\n");
  const minIndent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.search(/\S/))
  );

  return lines
    .map((line) => (line.trim() ? line.substring(minIndent) : ""))
    .join("\n")
    .trim();
}

export function minifyCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, "") // Remove comments
    .replace(/\s+/g, " ") // Remove extra whitespace
    .trim();
}

export function highlightSyntax(code: string, language: string): string {
  // Placeholder for syntax highlighting
  // Can integrate with prism.js or highlight.js
  return code;
}
