import {
  ComponentContract,
  FileSummary,
  ProjectManifest,
  ValidationMismatch,
} from "@/types/contract";
import type { FileData } from "@/types/ai";

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
  // Use a distinct separator (NOT "// FILE:") so it never collides with
  // the "// FILE:" markers the AI uses in its output, which extractMultipleFiles parses.
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
  return /\.(jsx|css|js)$/i.test(fileName);
}

export function isContractFile(fileName: string): boolean {
  return fileName.includes("/components/") && /\.jsx$/i.test(fileName);
}

export function orderedManifestFiles(manifest: ProjectManifest): string[] {
  const files = [...manifest.files];

  files.sort((a, b) => {
    const rank = (file: string) => {
      // Generate components first
      if (file.includes("/components/")) return 1;
      // Then App.jsx
      if (file.endsWith("App.jsx")) return 2;
      // Then CSS files (so they can see the exact classes used in components)
      if (file.endsWith(".css")) return 3;
      return 0;
    };

    return rank(a) - rank(b);
  });

  return files;
}
