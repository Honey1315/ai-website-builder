import type { FileData } from "@/types/ai";

/**
 * Extract all unique class names used via className="..." in JSX.
 * Handles double and single quoted values.
 */
export function extractClassNamesFromJsx(jsx: string): string[] {
  const classNames = new Set<string>();
  const regex = /className\s*=\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(jsx)) !== null) {
    match[1].split(/\s+/).forEach((cls) => {
      if (cls.trim()) classNames.add(cls.trim());
    });
  }
  return Array.from(classNames);
}

/**
 * Generate CSS content with one empty rule per class name.
 */
export function generateCssContent(classNames: string[]): string {
  if (classNames.length === 0) return "";
  return classNames.map((cls) => `.${cls} {\n  /* TODO: add styles */\n}`).join("\n\n");
}

/**
 * Given JSX source code, return a FileData for its companion CSS file.
 * Returns null if no class names are found.
 *
 * The CSS filename mirrors the component name:
 *   export default function Navbar  →  src/Navbar.css
 */
export function createCssFileForJsx(
  jsx: string,
  jsxFileName: string
): FileData | null {
  const classNames = extractClassNamesFromJsx(jsx);
  if (classNames.length === 0) return null;

  // Derive CSS filename from JSX filename (e.g. "src/Navbar.jsx" -> "src/Navbar.css")
  const cssName = jsxFileName.replace(/\.(jsx|tsx|js|ts)$/, ".css");

  return {
    name: cssName,
    content: generateCssContent(classNames),
    language: "css",
  };
}
