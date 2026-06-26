import {
  ComponentContract,
  MAX_GENERATED_FILES,
  ProjectArchitecture,
  ProjectManifest,
} from "@/types/contract";

const DEFAULT_FILES = ["src/App.jsx", "src/styles.css"];

const DEFAULT_ARCHITECTURE: ProjectArchitecture = {
  framework: "react",
  language: "javascript",
  styling: "css",
};

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

function normalizeProps(props: unknown): string[] {
  if (!Array.isArray(props)) return [];
  return props.filter((prop): prop is string => typeof prop === "string");
}

function normalizeComponents(components: unknown): ComponentContract[] {
  if (!Array.isArray(components)) return [];

  return components
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const name = String(item.name || "").trim();
      const file = typeof item.file === "string" ? normalizeFilePath(item.file) : undefined;

      return {
        name,
        file: file || (name ? componentFilePath(name) : undefined),
        props: normalizeProps(item.props),
      };
    })
    .filter((component) => component.name.length > 0);
}

function normalizeDependencies(dependencies: unknown): Record<string, string[]> {
  if (!dependencies || typeof dependencies !== "object" || Array.isArray(dependencies)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  Object.entries(dependencies as Record<string, unknown>).forEach(([parent, children]) => {
    if (!Array.isArray(children)) return;
    result[parent] = children.filter((child): child is string => typeof child === "string");
  });

  return result;
}

function normalizeArchitecture(architecture: unknown): ProjectArchitecture {
  if (!architecture || typeof architecture !== "object" || Array.isArray(architecture)) {
    return DEFAULT_ARCHITECTURE;
  }

  const arch = architecture as Record<string, unknown>;

  return {
    framework: typeof arch.framework === "string" ? arch.framework : DEFAULT_ARCHITECTURE.framework,
    language: typeof arch.language === "string" ? arch.language : DEFAULT_ARCHITECTURE.language,
    styling: typeof arch.styling === "string" ? arch.styling : DEFAULT_ARCHITECTURE.styling,
  };
}

function normalizeFilePaths(files: unknown): string[] {
  if (!Array.isArray(files)) return [];

  const normalized = files
    .filter((file): file is string => typeof file === "string")
    .map((file) => normalizeFilePath(file))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function normalizeFilePath(fileName: string): string {
  const normalized = fileName
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\/+/, "");

  if (normalized === "App.jsx" || normalized === "styles.css") {
    return `src/${normalized}`;
  }

  if (normalized.startsWith("components/")) {
    return `src/${normalized}`;
  }

  return normalized;
}

function componentFilePath(name: string): string {
  return `src/components/${name}.jsx`;
}

function ensureRequiredFiles(files: string[]): string[] {
  const result = new Set<string>(DEFAULT_FILES);
  files.forEach((file) => result.add(file));
  return Array.from(result).slice(0, MAX_GENERATED_FILES);
}

export function extractManifest(response: string): ProjectManifest | null {
  try {
    const jsonText = extractJsonBlock(response);
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;

    const components = normalizeComponents(parsed.components);
    const dependencies = normalizeDependencies(parsed.dependencies);
    const architecture = normalizeArchitecture(parsed.architecture);

    let files = normalizeFilePaths(parsed.files);

    components.forEach((component) => {
      const path = component.file || componentFilePath(component.name);
      component.file = path;
      if (!files.includes(path)) {
        files.push(path);
      }
    });

    files = ensureRequiredFiles(files);

    return {
      files,
      components,
      dependencies,
      architecture,
    };
  } catch {
    return null;
  }
}

export function createFallbackManifest(
  prompt: string,
  structure: string[] = []
): ProjectManifest {
  const isComplex =
    prompt.length > 120 ||
    /dashboard|multi|several|multiple|table|form|modal|sidebar/i.test(prompt);

  const files =
    structure.length > 0
      ? ensureRequiredFiles(structure)
      : isComplex
        ? ["src/App.jsx", "src/styles.css"]
        : ["src/App.jsx", "src/styles.css"];

  const components = files
    .filter((file) => file.startsWith("src/components/"))
    .map((file) => {
      const name = file.split("/").pop()?.replace(/\.[^.]+$/, "") || "Component";
      return { name, file, props: [] as string[] };
    });

  const dependencies: Record<string, string[]> = {};
  if (components.length > 0) {
    dependencies.App = components.map((component) => component.name);
  }

  return {
    files,
    components,
    dependencies,
    architecture: DEFAULT_ARCHITECTURE,
  };
}
