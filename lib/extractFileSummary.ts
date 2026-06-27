import { FileSummary } from "@/types/contract";

function extractJsonBlock(response: string): string {
  const trimmed = response.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  return trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

import { extractClassNamesFromJsx } from "@/lib/cssGenerator";

export function extractFileSummary(response: string, fileName: string, fileContent: string = ""): FileSummary {
  try {
    const jsonText = extractJsonBlock(response);
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;

    return {
      file: typeof parsed.file === "string" ? parsed.file : fileName,
      exports: normalizeStringArray(parsed.exports),
      imports: normalizeStringArray(parsed.imports),
      props: normalizeStringArray(parsed.props),
      children: normalizeStringArray(parsed.children),
      cssClasses: extractClassNamesFromJsx(fileContent),
    };
  } catch {
    return {
      file: fileName,
      exports: [],
      imports: [],
      props: [],
      children: [],
      cssClasses: extractClassNamesFromJsx(fileContent),
    };
  }
}
