import { findComponentFile } from "@/lib/contractHelpers";
import {
  FileMetadata,
  ProjectManifest,
  ValidationMismatch,
} from "@/types/contract";

function sortProps(props: string[]): string[] {
  return [...props].sort();
}

function propsEqual(a: string[], b: string[]): boolean {
  const sortedA = sortProps(a);
  const sortedB = sortProps(b);

  if (sortedA.length !== sortedB.length) return false;
  return sortedA.every((prop, index) => prop === sortedB[index]);
}

function getContractProps(manifest: ProjectManifest, componentName: string): string[] | undefined {
  return manifest.components.find((component) => component.name === componentName)?.props;
}

export function resolveRelativePath(parentFile: string, importPath: string): string {
  const cleanParent = parentFile.replace(/^\/+/, "");
  const parts = cleanParent.split("/");
  parts.pop(); // Remove parent filename

  const segments = importPath.split("/");
  for (const seg of segments) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") {
      parts.pop();
    } else {
      parts.push(seg);
    }
  }

  return parts.join("/");
}

function doesProjectFileExist(targetPath: string, existingPaths: Set<string>): boolean {
  const clean = targetPath.replace(/^\/+/, "");
  if (existingPaths.has(clean) || existingPaths.has(`/${clean}`)) return true;

  const extensions = [".jsx", ".js", ".tsx", ".ts", "/index.jsx", "/index.js", "/index.tsx", "/index.ts"];
  for (const ext of extensions) {
    if (existingPaths.has(clean + ext) || existingPaths.has(`/${clean}${ext}`)) return true;
  }

  // Base sandbox files are always provided
  if (
    clean === "src/index.css" ||
    clean === "src/main.jsx" ||
    clean === "index.html" ||
    clean === "vite.config.js" ||
    clean.endsWith(".css")
  ) {
    return true;
  }

  return false;
}

export function validateContracts(
  manifest: ProjectManifest,
  metadataByFile: Map<string, FileMetadata>
): ValidationMismatch[] {
  const mismatches: ValidationMismatch[] = [];
  const existingFileKeys = new Set(Array.from(metadataByFile.keys()));

  // 1. Verify that all local relative imports point to existing project files
  for (const [parentFile, metadata] of metadataByFile.entries()) {
    if (metadata.localImports && metadata.localImports.length > 0) {
      for (const localImport of metadata.localImports) {
        const resolved = resolveRelativePath(parentFile, localImport.source);
        if (!doesProjectFileExist(resolved, existingFileKeys)) {
          const compName = localImport.names[0] || resolved.split("/").pop() || "Component";
          mismatches.push({
            type: "missing_dependency",
            parentFile,
            childFile: resolved,
            component: compName,
            expected: ["existing project file"],
            actual: [`non-existent: ${localImport.source}`],
            message: `${parentFile} imports '${localImport.source}', but this file does not exist in the project. Correct the import path to match an existing project file or remove the unused import.`,
          });
        }
      }
    }
  }

  for (const component of manifest.components) {
    const filePath = findComponentFile(manifest, component.name);
    const metadata = filePath ? metadataByFile.get(filePath) : undefined;

    if (!filePath || !metadata) {
      mismatches.push({
        type: "missing_dependency",
        childFile: filePath,
        component: component.name,
        expected: component.props,
        actual: [],
        message: `Component ${component.name} is declared in manifest but has no generated file.`,
      });
      continue;
    }

    const exported = metadata.exports.includes(component.name);
    if (!exported) {
      mismatches.push({
        type: "export_mismatch",
        childFile: filePath,
        component: component.name,
        expected: [component.name],
        actual: metadata.exports,
        message: `File ${filePath} must export ${component.name}.`,
      });
    }

    const acceptedProps = metadata.componentProps[component.name] || [];
    if (component.props.length > 0 && !propsEqual(acceptedProps, component.props)) {
      mismatches.push({
        type: "prop_mismatch",
        childFile: filePath,
        component: component.name,
        expected: component.props,
        actual: acceptedProps,
        message: `${component.name} contract expects props [${component.props.join(", ")}] but component accepts [${acceptedProps.join(", ")}].`,
      });
    }
  }

  for (const [parentFile, metadata] of metadataByFile.entries()) {
    for (const usage of metadata.usages) {
      const contractProps = getContractProps(manifest, usage.component);
      if (!contractProps) continue;

      if (!propsEqual(usage.props, contractProps)) {
        mismatches.push({
          type: "prop_mismatch",
          parentFile,
          component: usage.component,
          expected: contractProps,
          actual: usage.props,
          message: `${parentFile} uses <${usage.component} /> with props [${usage.props.join(", ")}] but contract requires [${contractProps.join(", ")}].`,
        });
      }

      const childFile = findComponentFile(manifest, usage.component);
      const childMetadata = childFile ? metadataByFile.get(childFile) : undefined;

      if (childMetadata && !childMetadata.exports.includes(usage.component)) {
        mismatches.push({
          type: "export_mismatch",
          parentFile,
          childFile,
          component: usage.component,
          expected: [usage.component],
          actual: childMetadata.exports,
          message: `${parentFile} imports ${usage.component} but ${childFile} does not export it.`,
        });
      }

      if (childMetadata) {
        const childAccepted = childMetadata.componentProps[usage.component] || [];
        if (childAccepted.length > 0 && !propsEqual(usage.props, childAccepted)) {
          mismatches.push({
            type: "prop_mismatch",
            parentFile,
            childFile,
            component: usage.component,
            expected: childAccepted,
            actual: usage.props,
            message: `${parentFile} passes props [${usage.props.join(", ")}] to ${usage.component} but ${childFile} accepts [${childAccepted.join(", ")}].`,
          });
        }
      }

      if (metadata.imports.indexOf(usage.component) === -1 && parentFile !== findComponentFile(manifest, usage.component)) {
        mismatches.push({
          type: "import_mismatch",
          parentFile,
          childFile,
          component: usage.component,
          expected: [usage.component],
          actual: metadata.imports,
          message: `${parentFile} uses ${usage.component} but does not import it.`,
        });
      }
    }
  }

  return dedupeMismatches(mismatches);
}

function dedupeMismatches(mismatches: ValidationMismatch[]): ValidationMismatch[] {
  const seen = new Set<string>();

  return mismatches.filter((mismatch) => {
    const key = [
      mismatch.type,
      mismatch.parentFile || "",
      mismatch.childFile || "",
      mismatch.component,
      mismatch.expected.join(","),
      mismatch.actual.join(","),
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAffectedFiles(mismatches: ValidationMismatch[]): string[] {
  const files = new Set<string>();

  mismatches.forEach((mismatch) => {
    if (mismatch.parentFile) files.add(mismatch.parentFile);
    if (mismatch.childFile) files.add(mismatch.childFile);
  });

  return Array.from(files);
}
