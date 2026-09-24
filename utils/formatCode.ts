export function formatCode(code: string): string {
  let formatted = code.trim();

  if (formatted.startsWith("```")) {
    formatted = formatted.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
  }

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
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function highlightSyntax(code: string, language: string): string {
  return code;
}
