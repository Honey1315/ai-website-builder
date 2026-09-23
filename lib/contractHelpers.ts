import {
  ComponentContract,
  FileSummary,
  ProjectManifest,
  ValidationMismatch,
} from "@/types/contract";
import type { FileData } from "@/types/ai";
import { resolveRelativePath } from "@/lib/contractValidation";

export function componentNameFromFile(fileName: string): string | null {
  if (fileName.endsWith("App.jsx")) return "App";
  if (!fileName.includes("/components/")) return null;
  return fileName.split("/").pop()?.replace(/\.[^.]+$/, "") || null;
}

export function findComponentFile(
  manifest: ProjectManifest,
  componentName: string
): string | undefined {
  const fromContract = manifest.components.find(
    (component) => component.name === componentName
  )?.file;

  if (fromContract && manifest.files.includes(fromContract)) {
    return fromContract;
  }

  const expectedPath = `src/components/${componentName}.jsx`;
  if (manifest.files.includes(expectedPath)) {
    return expectedPath;
  }

  return manifest.files.find((file) => {
    const base = file.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    return base === componentName;
  });
}

export function getComponentContract(
  manifest: ProjectManifest,
  fileName: string
): ComponentContract | undefined {
  const name = componentNameFromFile(fileName);
  if (!name) return undefined;
  return manifest.components.find((component) => component.name === name);
}

export function getDirectDependencies(
  manifest: ProjectManifest,
  fileName: string
): ComponentContract[] {
  const name = componentNameFromFile(fileName);
  const lookupName = name || "App";
  const childNames = manifest.dependencies[lookupName] || [];

  if (childNames.length === 0 && (fileName.endsWith("App.jsx") || name === "App")) {
    return manifest.components;
  }

  return manifest.components.filter((component) => childNames.includes(component.name));
}

export function formatContractBlock(contract?: ComponentContract): string {
  if (!contract) {
    return "None (not a component file)";
  }

  return JSON.stringify(
    {
      name: contract.name,
      file: contract.file,
      props: contract.props,
    },
    null,
    2
  );
}

export function formatDependenciesBlock(dependencies: ComponentContract[]): string {
  if (dependencies.length === 0) {
    return "None";
  }

  return dependencies
    .map((dep) => `${dep.name}({ ${dep.props.join(", ")} })`)
    .join("\n");
}

export function formatManifestBlock(manifest: ProjectManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export function formatStructureBlock(structure: string[]): string {
  return structure.join("\n");
}

export function formatSummariesBlock(summaries: Map<string, FileSummary>): string {
  if (summaries.size === 0) {
    return "None";
  }

  return Array.from(summaries.values())
    .map((summary) => JSON.stringify(summary))
    .join("\n");
}

export function formatFilesBlock(files: FileData[]): string {
  return files
    .map((file) => `=== FILE: ${file.name} ===\n${file.content}`)
    .join("\n\n");
}

export function formatMismatchBlock(mismatches: ValidationMismatch[]): string {
  return mismatches
    .map((mismatch) => `- ${mismatch.message}`)
    .join("\n");
}

export function isCodegenFile(fileName: string): boolean {
  return /\.(jsx|js|config\.js|html|css|json)$/i.test(fileName);
}

export function isContractFile(fileName: string): boolean {
  return fileName.includes("/components/") && /\.jsx$/i.test(fileName);
}

export function isDataOrUtilFile(fileName: string): boolean {
  return (
    fileName.includes("/data/") ||
    fileName.includes("/utils/") ||
    fileName.includes("/constants/") ||
    fileName.includes("/types/") ||
    fileName.endsWith(".json")
  );
}

export function formatSharedDataBlock(files: FileData[]): string {
  if (!files || files.length === 0) {
    return "None (no separate shared data or constants files)";
  }

  return files
    .map((file) => `=== FILE: ${file.name} ===\n${file.content}`)
    .join("\n\n");
}

export function orderedManifestFiles(manifest: ProjectManifest): string[] {
  const files = [...manifest.files];

  files.sort((a, b) => {
    const rank = (file: string) => {
      // Configuration files and HTML first
      if (file.endsWith(".config.js") || file === "index.html") return 0;
      // Data models, mock datasets, types, and utility constants FIRST so concrete schemas exist for components
      if (isDataOrUtilFile(file)) return 1;
      // Main entry and Tailwind setup
      if (file === "src/main.jsx" || file === "src/index.css") return 2;
      // Reusable components
      if (file.includes("/components/")) return 3;
      // App.jsx root component LAST so it can wire together components and data
      if (file.endsWith("App.jsx")) return 4;
      return 5;
    };

    return rank(a) - rank(b);
  });

  return files;
}

/**
 * Scans all project files for local relative imports (e.g. ./Component or ../Component).
 * If any imported local file is missing from the project files list, synthesizes a safe,
 * neutral placeholder component so Vite never crashes with "Failed to resolve import".
 */
export function ensureMissingImportsExist(files: FileData[]): FileData[] {
  const result = [...files];
  const fileNames = new Set(files.map((f) => f.name.replace(/^\/+/, "")));

  const isPresent = (path: string): boolean => {
    const clean = path.replace(/^\/+/, "");
    if (fileNames.has(clean) || fileNames.has(`/${clean}`)) return true;
    const exts = [".jsx", ".js", ".tsx", ".ts", "/index.jsx", "/index.js"];
    return exts.some((ext) => fileNames.has(clean + ext) || fileNames.has(`/${clean}${ext}`));
  };

  const IMPORT_RE = /import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;

  for (const file of files) {
    if (!/\.(jsx|tsx|js|ts)$/i.test(file.name)) continue;

    let match: RegExpExecArray | null;
    const content = file.content;
    const regex = new RegExp(IMPORT_RE);

    while ((match = regex.exec(content)) !== null) {
      const defaultImport = match[1]?.trim();
      const namedImports = match[2]
        ? match[2]
            .split(",")
            .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
            .filter(Boolean)
        : [];
      const importPath = match[3]?.trim();

      if (!importPath || !importPath.startsWith(".")) continue;

      const resolved = resolveRelativePath(file.name, importPath);

      // Skip base foundation files
      if (
        resolved.endsWith(".css") ||
        resolved === "src/index.css" ||
        resolved === "src/main.jsx" ||
        resolved === "index.html" ||
        resolved === "vite.config.js"
      ) {
        continue;
      }

      if (!isPresent(resolved)) {
        const targetPath = /\.[a-zA-Z0-9]+$/.test(resolved) ? resolved : `${resolved}.jsx`;
        const compName =
          defaultImport ||
          namedImports[0] ||
          resolved.split("/").pop()?.replace(/\.[^.]+$/, "") ||
          "Component";

        const namedExportsCode = namedImports
          .filter((n) => n !== defaultImport)
          .map((n) => `export function ${n}(props) { return null; }`)
          .join("\n");

        const placeholderContent = `import React from 'react';

// Auto-generated fallback container for unresolved import
export default function ${compName}({ children, ...props }) {
  return (
    <div data-component="${compName}" className="contents">
      {children || null}
    </div>
  );
}
${namedExportsCode ? "\n" + namedExportsCode : ""}
`;

        const normalizedName = targetPath.startsWith("/") ? targetPath.slice(1) : targetPath;
        result.push({
          name: normalizedName,
          content: placeholderContent,
          language: "javascript",
        });
        fileNames.add(normalizedName);
        console.warn(
          `[Auto-Scaffold] Created missing component placeholder for '${importPath}' referenced in '${file.name}' -> '${normalizedName}'`
        );
      }
    }
  }

  return result;
}

/**
 * Determines whether a file is an ungenerated placeholder or contains real code.
 */
export function isPlaceholderFile(file?: { name: string; content?: string } | null): boolean {
  if (!file || !file.content || !file.content.trim()) return true;
  const content = file.content.trim();
  if (content.includes("Waiting for ") && content.includes("...")) return true;
  if (content.includes("Generating ") && content.includes("...</div>")) return true;
  if (content.includes("Auto-generated fallback container for unresolved import")) return true;
  if (content === "{}" || content === "<div></div>" || content === "export default {};") return true;
  return false;
}