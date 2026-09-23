import { FileData } from "@/types/ai";

export function extractCode(response: string): string {
  const trimmed = response.trim();

  const fileMarkerPattern = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  const fileMarkerMatch = fileMarkerPattern.exec(trimmed);
  if (fileMarkerMatch) {
    let raw = fileMarkerMatch[2].trim();
    if (raw.endsWith('// END_FILE')) {
      const lines = raw.split('\n');
      if (lines.length > 0 && lines[lines.length - 1].trim() === '// END_FILE') {
        lines.pop();
      }
      raw = lines.join('\n').trim();
    }
    const fenceMatch = raw.match(/```[\w]*\n([\s\S]*?)\n```/);
    const content = fenceMatch ? fenceMatch[1].trim() : raw;
    return content;
  }

  let code = trimmed;
  if (code.startsWith("```")) {
    const match = code.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    if (match) {
      code = match[1];
    }
  }

  if (
    code.includes("import ") ||
    code.includes("export ") ||
    code.includes("const ") ||
    code.includes("function ")
  ) {
    return code.trim();
  }

  const codeBlockMatch = code.match(/```[\w]*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  return code.trim();
}

export function extractMultipleFiles(response: string): FileData[] {
  const files: FileData[] = [];

  const fileMarkerPattern = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  let match;

  while ((match = fileMarkerPattern.exec(response)) !== null) {
    const filename = normalizeGeneratedFileName(match[1]);
    let raw = match[2].trim();

    if (raw.endsWith('// END_FILE')) {
      const lines = raw.split('\n');
      if (lines.length > 0 && lines[lines.length - 1].trim() === '// END_FILE') {
        lines.pop();
      }
      raw = lines.join('\n').trim();
    }

    const fenceMatch = raw.match(/```[\w]*\n([\s\S]*?)\n```/);
    const content = fenceMatch ? fenceMatch[1].trim() : raw;

    files.push({
      name: filename,
      content,
      language: getLanguageFromFilename(filename),
    });
  }

  if (files.length > 0) return files;

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

  const unnamedFencePattern = /```([\w]*)\n([\s\S]*?)```/g;
  const blocks: { lang: string; content: string }[] = [];
  while ((match = unnamedFencePattern.exec(response)) !== null) {
    blocks.push({ lang: match[1].toLowerCase(), content: match[2].trim() });
  }

  if (blocks.length > 1) {
    const langCounters: Record<string, number> = {};
    for (const block of blocks) {
      const ext = langToExtension(block.lang);
      langCounters[ext] = (langCounters[ext] || 0) + 1;
      const count = langCounters[ext];
      let name: string;
      if (ext === "jsx" || ext === "js") {
        name = count === 1 ? "src/App.jsx" : `src/components/Component${count}.jsx`;
      } else if (ext === "css") {
        name = "src/index.css";
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
  const fileRegex = /([\w\-./]+\.(?:jsx|tsx|js|ts|config\.js|html|css|json))/i;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

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

  if (["index.html", "vite.config.js"].includes(normalizedName)) {
    return normalizedName;
  }

  if (normalizedName.startsWith("src/")) {
    return normalizedName;
  }

  if (normalizedName === "App.jsx" || normalizedName === "main.jsx" || normalizedName === "index.css") {
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
  const hasJSX = /<[A-Z]/.test(code) || /return\s*\(/.test(code);
  const hasExport = /export\s+(default\s+)?function|const\s+\w+\s*=/.test(code);
  return hasJSX || hasExport;
}