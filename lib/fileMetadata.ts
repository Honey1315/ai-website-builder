import { ComponentUsage, FileMetadata } from "@/types/contract";

const JSX_TAG = /<([A-Z][A-Za-z0-9]*)\b([^/>]*)\/?>/g;
const IMPORT_NAMED = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const IMPORT_DEFAULT = /import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_DEFAULT_FN =
  /export\s+default\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/;
const EXPORT_NAMED_FN = /export\s+function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/;
const EXPORT_DEFAULT_CONST =
  /export\s+default\s+(?:const|function)\s+([A-Za-z_$][\w$]*)\s*(?:=\s*)?(?:\(([^)]*)\)|\(\{([^}]*)\}\))/;

function parseDestructuredProps(params: string): string[] {
  const trimmed = params.trim();
  if (!trimmed) return [];

  const objectMatch = trimmed.match(/^\{([^}]*)\}/);
  if (!objectMatch) return [];

  return objectMatch[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(":")[0].trim().split("=")[0].trim())
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

  const patterns = [EXPORT_DEFAULT_FN, EXPORT_NAMED_FN, EXPORT_DEFAULT_CONST];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (!match) continue;

    const name = match[1];
    const params = match[2] || match[3] || "";
    exports.push(name);
    componentProps[name] = parseDestructuredProps(params.startsWith("{") ? params : `{${params}}`);
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

export function extractFileMetadata(fileName: string, content: string): FileMetadata {
  const { exports, componentProps } = extractExports(content);
  const imports = extractImports(content);
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
