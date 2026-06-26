export interface ComponentContract {
  name: string;
  file?: string;
  props: string[];
}

export interface ProjectArchitecture {
  framework: string;
  language: string;
  styling: string;
}

export interface ProjectManifest {
  files: string[];
  components: ComponentContract[];
  dependencies: Record<string, string[]>;
  architecture: ProjectArchitecture;
}

export interface FileSummary {
  file: string;
  exports: string[];
  imports: string[];
  props: string[];
  children: string[];
}

export interface ComponentUsage {
  component: string;
  props: string[];
}

export interface FileMetadata {
  name: string;
  imports: string[];
  exports: string[];
  componentProps: Record<string, string[]>;
  usages: ComponentUsage[];
  dependencies: string[];
}

export type ValidationMismatchType =
  | "prop_mismatch"
  | "import_mismatch"
  | "export_mismatch"
  | "missing_dependency";

export interface ValidationMismatch {
  type: ValidationMismatchType;
  parentFile?: string;
  childFile?: string;
  component: string;
  expected: string[];
  actual: string[];
  message: string;
}

export interface GenerationContext {
  manifest: ProjectManifest;
  metadataByFile: Map<string, FileMetadata>;
}

export const MAX_GENERATED_FILES = 10;
