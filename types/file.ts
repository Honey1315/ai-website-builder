export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  editable: boolean;
}

export interface FileTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  content?: string;
  language?: string;
}

export interface FileParseResult {
  files: ProjectFile[];
  entryPoint: string;
  dependencies?: Record<string, string>;
}
