import { ComponentUsage, FileMetadata } from "@/types/contract";

const JSX_TAG = /<([A-Z][A-Za-z0-9]*)\b([^/>]*)\/?>/g;
const IMPORT_NAMED = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const IMPORT_DEFAULT = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_DEFAULT_FN =
  /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/;
const EXPORT_NAMED_FN = /export\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/;
const EXPORT_DEFAULT_CONST =
  /export\s+default\s+(?:const|function)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*)?(?:\(([^)]*)\)|\(\{([^}]*)\}\))/;

function extractParameterString(content: string, fnName: string): string | null {
  let fnRegex: RegExp;
  if (fnName === "default") {
    fnRegex = /export\s+default\s+function\s*\(/g;
  } else {
    fnRegex = new RegExp(
      `(?:export\\s+default\\s+(?:function|const)?\\s*|export\\s+function\\s+|export\\s+const\\s+|const\\s+)${fnName}\\s*(?:=\\s*(?:function\\s*)?)?\\(`,
      "g"
    );
  }

  const match = fnRegex.exec(content);
  if (!match) return null;

  let depth = 1;
  const startIndex = fnRegex.lastIndex;
  let i = startIndex;

  while (i < content.length && depth > 0) {
    const char = content[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;
    i++;
  }

  return content.slice(startIndex, i - 1);
}

function parseDestructuredProps(params: string): string[] {
  const trimmed = params.trim();
  if (!trimmed.startsWith("{")) return [];

  // Find matching closing brace for the destructuring object
  let depth = 0;
  let insideBraces = "";
  let found = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === "{") {
      depth++;
      if (depth === 1) continue;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        insideBraces = trimmed.slice(1, i);
        found = true;
        break;
      }
    }
  }

  if (!found) return [];

  // Parse top-level comma-separated items inside `{ ... }`
  const props: string[] = [];
  let current = "";
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < insideBraces.length; i++) {
    const char = insideBraces[i];
    if (char === "(") parenDepth++;
    else if (char === ")") parenDepth--;
    else if (char === "{") braceDepth++;
    else if (char === "}") braceDepth--;
    else if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth--;

    if (char === "," && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      if (current.trim()) props.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) props.push(current.trim());

  return props
    .map((item) => {
      const cleaned = item.split("=")[0].split(":")[0].trim();
      const identMatch = cleaned.match(/^[A-Za-z_$][\w$]*/);
      return identMatch ? identMatch[0] : "";
    })
    .filter(Boolean);
}

function parseJsxProps(attributeString: string): string[] {
  const props: string[] = [];
  const attrPattern =
    /([A-Za-z_$][\w$]*)(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?/g;

  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(attributeString)) !== null) {
    const propName = match[1];
    if (propName !== "className" && propName !== "key") {
      props.push(propName);
    }
  }

  return props;
}

function extractImports(content: string): string[] {
  const imports = new Set<string>();

  let match: RegExpExecArray | null;

  while ((match = IMPORT_NAMED.exec(content)) !== null) {
    match[1]
      .split(",")
      .map((part) => part.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .forEach((name) => imports.add(name));
  }

  while ((match = IMPORT_DEFAULT.exec(content)) !== null) {
    imports.add(match[1]);
  }

  return Array.from(imports);
}

function extractExports(content: string): { exports: string[]; componentProps: Record<string, string[]> } {
  const exports: string[] = [];
  const componentProps: Record<string, string[]> = {};

  const exportPatterns = [
    /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /export\s+function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\s*)?\(/g,
    /export\s+default\s+([A-Za-z_$][\w$]*)\b/g,
  ];

  const foundNames = new Set<string>();

  for (const regex of exportPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (name && name !== "function" && name !== "const" && !foundNames.has(name)) {
        foundNames.add(name);
        exports.push(name);
      }
    }
  }

  // Handle anonymous export default function(...)
  if (!foundNames.has("default")) {
    const anonMatch = content.match(/export\s+default\s+function\s*\(/);
    if (anonMatch) {
      exports.push("default");
    }
  }

  // Extract parameters for each component using balanced parenthesis parsing
  for (const name of exports) {
    const paramStr = extractParameterString(content, name);
    if (paramStr) {
      componentProps[name] = parseDestructuredProps(paramStr);
    } else {
      componentProps[name] = [];
    }
  }

  return { exports, componentProps };
}

function extractUsages(content: string): ComponentUsage[] {
  const usages: ComponentUsage[] = [];

  let match: RegExpExecArray | null;
  while ((match = JSX_TAG.exec(content)) !== null) {
    const component = match[1];
    const attrs = match[2] || "";
    usages.push({
      component,
      props: parseJsxProps(attrs),
    });
  }

  return usages;
}

function extractLocalImports(content: string): { source: string; names: string[] }[] {
  const localImports: { source: string; names: string[] }[] = [];
  const IMPORT_NAMED_RE = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  const IMPORT_DEFAULT_RE = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
  const IMPORT_ALL_RE = /import\s+\*\s+as\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;

  let match: RegExpExecArray | null;
  while ((match = IMPORT_NAMED_RE.exec(content)) !== null) {
    const source = match[2].trim();
    if (source.startsWith(".")) {
      const names = match[1]
        .split(",")
        .map((p) => p.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean);
      localImports.push({ source, names });
    }
  }

  while ((match = IMPORT_DEFAULT_RE.exec(content)) !== null) {
    const source = match[2].trim();
    if (source.startsWith(".")) {
      localImports.push({ source, names: [match[1].trim()] });
    }
  }

  while ((match = IMPORT_ALL_RE.exec(content)) !== null) {
    const source = match[2].trim();
    if (source.startsWith(".")) {
      localImports.push({ source, names: [match[1].trim()] });
    }
  }

  return localImports;
}

export function extractFileMetadata(fileName: string, content: string): FileMetadata {
  const { exports, componentProps } = extractExports(content);
  const imports = extractImports(content);
  const localImports = extractLocalImports(content);
  const usages = extractUsages(content);

  const dependencies = usages
    .map((usage) => usage.component)
    .filter((name) => exports.indexOf(name) === -1);

  return {
    name: fileName,
    imports,
    exports,
    componentProps,
    usages,
    dependencies,
    localImports,
  };
}

export function buildMetadataMap(
  files: { name: string; content: string }[]
): Map<string, FileMetadata> {
  const map = new Map<string, FileMetadata>();

  files.forEach((file) => {
    if (!/\.(jsx|tsx|js|ts)$/i.test(file.name)) return;
    map.set(file.name, extractFileMetadata(file.name, file.content));
  });

  return map;
}
