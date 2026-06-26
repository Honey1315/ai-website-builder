import { FileData } from "@/types/ai";

export function extractCode(response: string): string {
  // Trim the response to handle any surrounding whitespace
  const trimmed = response.trim();

  // Handle single file with FILE markers — use same logic as extractMultipleFiles Strategy 1
  const fileMarkerPattern = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  const fileMarkerMatch = fileMarkerPattern.exec(trimmed);
  if (fileMarkerMatch) {
    console.log('extractCode: Detected FILE markers');
    let raw = fileMarkerMatch[2].trim();
    // Remove trailing // END_FILE if present (as per SYSTEM_PROMPT)
    if (raw.endsWith('// END_FILE')) {
      console.log('extractCode: Removing trailing // END_FILE');
      // Split into lines, remove the last line if it's exactly // END_FILE (trimmed)
      const lines = raw.split('\n');
      if (lines.length > 0 && lines[lines.length-1].trim() === '// END_FILE') {
        lines.pop();
      }
      raw = lines.join('\n').trim();
    }
    // Strip any wrapping code fences from the content block
    const fenceMatch = raw.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    const content = fenceMatch ? fenceMatch[1].trim() : raw;
    console.log('extractCode: Returning content from FILE markers:', content.substring(0, 100) + (content.length > 100 ? '...' : ''));
    return content;
  }

  // Remove markdown code blocks — match any language label (jsx, tsx, css, html, json, etc.)
  let code = trimmed;

  if (code.startsWith("```")) {
    // Match code blocks with any optional language specifier
    const match = code.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    if (match) {
      code = match[1];
    }
  }

  // If code looks like actual JS/JSX/TS code, return as-is
  if (
    code.includes("import ") ||
    code.includes("export ") ||
    code.includes("const ") ||
    code.includes("function ")
  ) {
    return code.trim();
  }

  // Otherwise try to extract from any markdown code fence
  const codeBlockMatch = code.match(/```[\w]*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  return code.trim();
}

export function extractMultipleFiles(response: string): FileData[] {
  const files: FileData[] = [];

  // Strategy 1: // FILE: filename\n...content pattern
  const fileMarkerPattern = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  let match;

  while ((match = fileMarkerPattern.exec(response)) !== null) {
    const filename = normalizeGeneratedFileName(match[1]);
    // Strip any wrapping code fences from the content block
    let raw = match[2].trim();
    // Remove trailing // END_FILE if present (as per SYSTEM_PROMPT)
    if (raw.endsWith('// END_FILE')) {
      // Split into lines, remove the last line if it's exactly // END_FILE (trimmed)
      const lines = raw.split('\n');
      if (lines.length > 0 && lines[lines.length-1].trim() === '// END_FILE') {
        lines.pop();
      }
      raw = lines.join('\n').trim();
    }
    const fenceMatch = raw.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    const content = fenceMatch ? fenceMatch[1].trim() : raw;

    files.push({
      name: filename,
      content,
      language: getLanguageFromFilename(filename),
    });
  }

  if (files.length > 0) return files;

  // Strategy 2: Named fenced blocks — ```jsx (App.jsx) or ```css (styles.css)
  const namedFencePattern = /```([\w]+)\s+\(([^)]+)\)\n([\s\S]*?)```/g;
  while ((match = namedFencePattern.exec(response)) !== null) {
    const filename = normalizeGeneratedFileName(match[2]);
    const content = match[3].trim();
    files.push({
      name: filename,
      content,
      language: getLanguageFromFilename(filename),
    });
  }

  if (files.length > 0) return files;

  // Strategy 3: Multiple unnamed fenced blocks — split into separate files by language.
  // Detect all fenced blocks in the response.
  const unnamedFencePattern = /```([\w]*)\n([\s\S]*?)```/g;
  const blocks: { lang: string; content: string }[] = [];
  while ((match = unnamedFencePattern.exec(response)) !== null) {
    blocks.push({ lang: match[1].toLowerCase(), content: match[2].trim() });
  }

  if (blocks.length > 1) {
    // Multiple blocks — assign sensible file names based on language
    const langCounters: Record<string, number> = {};
    for (const block of blocks) {
      const ext = langToExtension(block.lang);
      langCounters[ext] = (langCounters[ext] || 0) + 1;
      const count = langCounters[ext];
      let name: string;
      if (ext === "jsx" || ext === "js") {
        name = count === 1 ? "src/App.jsx" : `src/components/Component${count}.jsx`;
      } else if (ext === "css") {
        name = count === 1 ? "src/styles.css" : `src/styles${count}.css`;
      } else {
        name = count === 1 ? `file.${ext}` : `file${count}.${ext}`;
      }
      files.push({
        name,
        content: block.content,
        language: getLanguageFromFilename(name),
      });
    }
    return files;
  }

  // Fallback: treat entire response as a single App.jsx — but only if it contains JS/JSX code
  // Avoid dumping CSS or non-JS content into App.jsx
  const singleContent = extractCode(response);
  const looksLikeJS =
    singleContent.includes("import ") ||
    singleContent.includes("export ") ||
    singleContent.includes("function ") ||
    singleContent.includes("const ") ||
    singleContent.includes("return (");

  if (looksLikeJS) {
    files.push({
      name: "src/App.jsx",
      content: singleContent,
      language: "javascript",
    });
  }

  return files;
}

export function extractFileStructure(response: string): string[] {
  const lines = response.split(/\r?\n/);
  const fileNames: string[] = [];
  const fileRegex = /([\w\-./]+\.(?:jsx|tsx|js|ts|css|html|json))/i;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove bullets, numbers, and punctuation prefixes.
    line = line.replace(/^[-*+\d.)\s]+/, "").trim();

    const match = line.match(fileRegex);
    if (match) {
      const fileName = normalizeGeneratedFileName(match[1]);
      if (fileName && !fileNames.includes(fileName)) {
        fileNames.push(fileName);
      }
    }
  }

  return fileNames;
}

function normalizeGeneratedFileName(fileName: string): string {
  const normalizedName = fileName
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\/+/, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  if (!normalizedName || normalizedName.startsWith("src/")) {
    return normalizedName;
  }

  if (normalizedName === "App.jsx" || normalizedName === "styles.css") {
    return `src/${normalizedName}`;
  }

  if (normalizedName.startsWith("components/")) {
    return `src/${normalizedName}`;
  }

  return normalizedName;
}

function langToExtension(lang: string): string {
  const map: Record<string, string> = {
    jsx: "jsx",
    tsx: "tsx",
    js: "js",
    ts: "ts",
    css: "css",
    scss: "css",
    html: "html",
    json: "json",
  };
  return map[lang] || "txt";
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    jsx: "javascript",
    tsx: "typescript",
    js: "javascript",
    ts: "typescript",
    css: "css",
    html: "html",
    json: "json",
  };
  return languageMap[ext || ""] || "text";
}

export function validateCode(code: string): boolean {
  // Basic validation - check for common JSX patterns
  const hasJSX = /<[A-Z]/.test(code) || /return\s*\(/.test(code);
  const hasExport = /export\s+(default\s+)?function|const\s+\w+\s*=/.test(code);

  return hasJSX || hasExport;
}
