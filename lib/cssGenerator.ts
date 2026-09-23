import type { FileData } from "@/types/ai";

/**
 * Extract all unique class names used via className="..." in JSX.
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
 * Deprecated in Tailwind architecture: Component-level separate CSS files are no longer generated.
 */
export function createCssFileForJsx(
  jsx: string,
  jsxFileName: string
): FileData | null {
  return null;
}