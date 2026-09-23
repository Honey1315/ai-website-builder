import { FileSummary } from "@/types/contract";

// ---------------------------------------------------------------------------
// Helpers for bracket-aware parameter and prop parsing
// ---------------------------------------------------------------------------

function extractBalancedBraces(text: string, startIndex: number): string | null {
  let depth = 0;
  let started = false;
  let start = -1;
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      if (!started) {
        started = true;
        start = i;
      }
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && started) {
        return text.substring(start + 1, i);
      }
    }
  }
  return null;
}

function cleanPropToken(token: string): string | null {
  let cleaned = token.trim();
  if (!cleaned) return null;
  // Skip rest spread (...props, ...rest)
  if (cleaned.startsWith("...")) return null;
  // Strip default values (= ...) first, handling potential functions/strings
  cleaned = cleaned.split("=")[0].trim();
  // Strip TypeScript / destructuring alias type (: ...)
  cleaned = cleaned.split(":")[0].trim();

  // Validate clean JavaScript identifier
  if (/^[A-Za-z_$][\w$]*$/.test(cleaned)) {
    // Skip built-in React prop-like tokens
    if (cleaned === "children" || cleaned === "key") return null;
    return cleaned;
  }
  return null;
}

function splitDestructuredProps(insideBraces: string): string[] {
  const props: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = 0; i < insideBraces.length; i++) {
    const char = insideBraces[i];
    if (char === "{" || char === "(" || char === "[") {
      depth++;
      current += char;
    } else if (char === "}" || char === ")" || char === "]") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      const clean = cleanPropToken(current);
      if (clean && !props.includes(clean)) props.push(clean);
      current = "";
    } else {
      current += char;
    }
  }

  const clean = cleanPropToken(current);
  if (clean && !props.includes(clean)) props.push(clean);

  return props;
}

function componentNameFromPath(fileName: string): string | undefined {
  if (!fileName) return undefined;
  const base = fileName.split("/").pop()?.replace(/\.[^.]+$/, "");
  if (!base) return undefined;
  // PascalCase component filename
  if (/^[A-Z][A-Za-z0-9_$]*$/.test(base)) {
    return base;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Export extraction (supports default function, default const/arrow, named, export default Identifier)
// ---------------------------------------------------------------------------

function extractAllExports(content: string, fallbackName?: string): {
  exports: string[];
  defaultExport: string | null;
  namedExports: string[];
} {
  const exports = new Set<string>();
  let defaultExport: string | null = null;
  const namedExports = new Set<string>();

  // 1. export default function Name(...)
  const defFnMatch = /export\s+default\s+function\s+([A-Za-z_$][\w$]*)/.exec(content);
  if (defFnMatch) {
    defaultExport = defFnMatch[1];
    exports.add(defFnMatch[1]);
  }

  // 2. export default Name; or export default Name (at bottom or anywhere)
  const defIdentMatch = /export\s+default\s+([A-Za-z_$][\w$]*)\s*;?/.exec(content);
  if (defIdentMatch && defIdentMatch[1] !== "function") {
    defaultExport = defIdentMatch[1];
    exports.add(defIdentMatch[1]);
  }

  // 3. Anonymous default export: export default function(...) or export default (...) =>
  if (!defaultExport && /export\s+default\s+(?:function\s*\(|\(|async\s*\()/.test(content)) {
    if (fallbackName) {
      defaultExport = fallbackName;
      exports.add(fallbackName);
    }
  }

  // 4. export function Name(...)
  const namedFnRegex = /export\s+function\s+([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = namedFnRegex.exec(content)) !== null) {
    namedExports.add(m[1]);
    exports.add(m[1]);
  }

  // 5. export const/let/var Name = ...
  const constRegex = /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = constRegex.exec(content)) !== null) {
    namedExports.add(m[1]);
    exports.add(m[1]);
  }

  // 6. export { A, B as C }
  const blockRegex = /export\s*\{([^}]+)\}/g;
  while ((m = blockRegex.exec(content)) !== null) {
    m[1].split(",").forEach((item) => {
      const parts = item.trim().split(/\s+as\s+/);
      const name = (parts[1] || parts[0]).trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) {
        if (parts[1] === "default") {
          defaultExport = parts[0].trim();
        } else {
          namedExports.add(name);
        }
        exports.add(name);
      }
    });
  }

  // Fallback: If no export detected in a component file, use the PascalCase component name
  if (exports.size === 0 && fallbackName) {
    exports.add(fallbackName);
    defaultExport = fallbackName;
  }

  return {
    exports: Array.from(exports),
    defaultExport,
    namedExports: Array.from(namedExports),
  };
}

// ---------------------------------------------------------------------------
// Props extraction (destructured parameters, body destructuring, props.xxx)
// ---------------------------------------------------------------------------

function extractComponentProps(content: string, componentName?: string): string[] {
  const patterns: RegExp[] = [];

  if (componentName) {
    patterns.push(new RegExp(`function\\s+${componentName}\\s*\\(`, "m"));
    patterns.push(new RegExp(`(?:const|let|var)\\s+${componentName}\\s*=\\s*(?:async\\s*)?\\(`, "m"));
  }
  patterns.push(/export\s+default\s+function\s*(?:[A-Za-z_$][\w$]*)?\s*\(/m);
  patterns.push(/export\s+default\s*(?:async\s*)?\(/m);
  patterns.push(/export\s+(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/m);
  patterns.push(/export\s+function\s+[A-Za-z_$][\w$]*\s*\(/m);

  for (const regex of patterns) {
    const match = regex.exec(content);
    if (!match) continue;

    const startIdx = match.index + match[0].length;
    const searchWindow = content.substring(startIdx, startIdx + 400);

    // Case 1: Destructured props in parameter list: ({ title, subtitle = "" })
    const braceOffset = searchWindow.indexOf("{");
    const closeParenOffset = searchWindow.indexOf(")");
    if (braceOffset !== -1 && (closeParenOffset === -1 || braceOffset < closeParenOffset)) {
      const inside = extractBalancedBraces(content, startIdx + braceOffset);
      if (inside) {
        const props = splitDestructuredProps(inside);
        if (props.length > 0) return props;
      }
    }

    // Case 2: Named props param: (props) => { const { a, b } = props; }
    const paramMatch = searchWindow.match(/^\s*([A-Za-z_$][\w$]*)\s*\)/);
    if (paramMatch) {
      const paramName = paramMatch[1];
      if (paramName !== "e" && paramName !== "event") {
        // Look for: const { ... } = props;
        const bodyDestruct = new RegExp(`(?:const|let|var)\\s*\\{([^}]+)\\}\\s*=\\s*${paramName}\\b`, "m").exec(content);
        if (bodyDestruct) {
          const props = splitDestructuredProps(bodyDestruct[1]);
          if (props.length > 0) return props;
        }
        // Look for: props.title, props.onSelect
        const propAccess = new RegExp(`\\b${paramName}\\.([A-Za-z_$][\\w$]*)`, "g");
        const accessedProps = new Set<string>();
        let accessMatch: RegExpExecArray | null;
        while ((accessMatch = propAccess.exec(content)) !== null) {
          if (accessMatch[1] !== "children" && accessMatch[1] !== "className") {
            accessedProps.add(accessMatch[1]);
          }
        }
        if (accessedProps.size > 0) return Array.from(accessedProps);
      }
    }
  }

  // Fallback: search for any top-level destructured props pattern
  const genericMatch = /\{([^}]{3,250})\}\s*(?::\s*[^)]+)?\s*\)\s*(?:=>|\{)/m.exec(content);
  if (genericMatch) {
    const props = splitDestructuredProps(genericMatch[1]);
    if (props.length > 0) return props;
  }

  return [];
}

// ---------------------------------------------------------------------------
// Imports & Children
// ---------------------------------------------------------------------------

const RE_IMPORT_NAMED = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const RE_IMPORT_DEFAULT = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
const RE_JSX_CHILD = /<([A-Z][A-Za-z0-9]*)\b/g;

function extractLocalImports(content: string): string[] {
  const names = new Set<string>();
  let m: RegExpExecArray | null;

  RE_IMPORT_NAMED.lastIndex = 0;
  while ((m = RE_IMPORT_NAMED.exec(content)) !== null) {
    m[1]
      .split(",")
      .map((p) => p.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean)
      .forEach((n) => names.add(n));
  }

  RE_IMPORT_DEFAULT.lastIndex = 0;
  while ((m = RE_IMPORT_DEFAULT.exec(content)) !== null) {
    names.add(m[1]);
  }

  return Array.from(names);
}

function extractChildComponents(content: string): string[] {
  const children = new Set<string>();
  let m: RegExpExecArray | null;
  RE_JSX_CHILD.lastIndex = 0;
  while ((m = RE_JSX_CHILD.exec(content)) !== null) {
    children.add(m[1]);
  }
  return Array.from(children);
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

function buildSignatures(
  content: string,
  exports: string[],
  defaultExport: string | null,
  props: string[]
): string[] {
  const sigs: string[] = [];

  for (const exp of exports) {
    // If it's the main default component export
    if (exp === defaultExport) {
      if (props.length > 0) {
        sigs.push(`${exp}({ ${props.join(", ")} })`);
      } else {
        sigs.push(`${exp}()`);
      }
      continue;
    }

    // Check if it's a named function with params
    const fnRegex = new RegExp(
      `(?:export\\s+)?(?:function\\s+${exp}\\s*\\(([^)]*)\\)|const\\s+${exp}\\s*=\\s*(?:async\\s*)?\\(([^)]*)\\))`,
      "m"
    );
    const fnMatch = fnRegex.exec(content);
    if (fnMatch) {
      const rawParams = (fnMatch[1] ?? fnMatch[2] ?? "").trim();
      if (rawParams.startsWith("{")) {
        const inside = extractBalancedBraces(rawParams, 0);
        const namedProps = inside ? splitDestructuredProps(inside) : [];
        sigs.push(namedProps.length > 0 ? `${exp}({ ${namedProps.join(", ")} })` : `${exp}()`);
      } else if (rawParams) {
        const cleanParams = rawParams
          .split(",")
          .map((p) => p.trim().split(/[=:]/)[0].trim())
          .filter(Boolean);
        sigs.push(`${exp}(${cleanParams.join(", ")})`);
      } else {
        sigs.push(`${exp}()`);
      }
    } else {
      // Variable, constant, or data array export
      sigs.push(exp);
    }
  }

  return sigs;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds an accurate FileSummary from the file content using local regex parsing.
 * Supports arrow functions, default exports at bottom, multiline params with defaults,
 * and strips CSS noise to keep downstream prompt tokens clean.
 */
export function localFileSummary(fileName: string, fileContent: string): FileSummary {
  const fallback = componentNameFromPath(fileName);
  const { exports, defaultExport } = extractAllExports(fileContent, fallback);
  const props = extractComponentProps(fileContent, defaultExport || fallback);
  const signatures = buildSignatures(fileContent, exports, defaultExport, props);

  return {
    file: fileName,
    exports,
    imports: extractLocalImports(fileContent),
    props,
    children: extractChildComponents(fileContent),
    signatures,
    cssClasses: [], // Keep empty to avoid cluttering LLM prompt context with hundreds of utility classes
  };
}

function extractJsonBlock(response: string): string {
  const trimmed = response.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (fencedMatch) return fencedMatch[1].trim();
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];
  return trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function extractFileSummary(
  response: string,
  fileName: string,
  fileContent: string = ""
): FileSummary {
  try {
    const jsonText = extractJsonBlock(response);
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const exports = normalizeStringArray(parsed.exports);
    const props = normalizeStringArray(parsed.props);
    const signatures = normalizeStringArray(parsed.signatures);

    // If LLM returned empty exports or invalid JSON, fall back to robust local parsing
    if (exports.length === 0 && fileContent) {
      return localFileSummary(fileName, fileContent);
    }

    return {
      file: typeof parsed.file === "string" ? parsed.file : fileName,
      exports,
      imports: normalizeStringArray(parsed.imports),
      props,
      children: normalizeStringArray(parsed.children),
      signatures,
      cssClasses: [],
    };
  } catch {
    // Fall back to robust local parsing when the LLM response cannot be parsed
    return localFileSummary(fileName, fileContent);
  }
}
