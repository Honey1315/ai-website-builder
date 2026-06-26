import { ProjectFile, FileTreeNode, FileParseResult } from "@/types/file";

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const nodeMap = new Map<string, FileTreeNode>();

  // Create nodes for each file
  files.forEach((file) => {
    const pathParts = file.path.split("/").filter((p) => p);
    let currentPath = "";

    // Create folder structure
    pathParts.slice(0, -1).forEach((part) => {
      currentPath += `/${part}`;
      if (!nodeMap.has(currentPath)) {
        nodeMap.set(currentPath, {
          id: currentPath,
          name: part,
          type: "folder",
          children: [],
        });
      }
    });

    // Create file node
    const fileNode: FileTreeNode = {
      id: file.id,
      name: file.name,
      type: "file",
      content: file.content,
      language: file.language,
    };

    nodeMap.set(file.path, fileNode);

    // Add to parent
    if (pathParts.length > 1) {
      const parentPath = `/${pathParts.slice(0, -1).join("/")}`;
      const parent = nodeMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileNode);
      }
    } else {
      root.push(fileNode);
    }
  });

  return root;
}

export function flattenFileTree(node: FileTreeNode, files: ProjectFile[] = []): ProjectFile[] {
  if (node.type === "file" && node.content) {
    files.push({
      id: node.id,
      name: node.name,
      content: node.content,
      language: node.language || "text",
      path: node.id,
      editable: true,
    });
  }

  if (node.children) {
    node.children.forEach((child) => flattenFileTree(child, files));
  }

  return files;
}

export function parseFileStructure(code: string): FileParseResult {
  const files: ProjectFile[] = [];

  // Extract files from code with pattern: // FILE: path/filename.tsx
  const filePattern = /\/\/\s*FILE:\s*([^\n]+)\n([\s\S]*?)(?=\/\/\s*FILE:|$)/g;
  let match;
  let hasFiles = false;

  while ((match = filePattern.exec(code)) !== null) {
    hasFiles = true;
    const path = match[1].trim();
    const content = match[2].trim();

    files.push({
      id: path,
      name: path.split("/").pop() || "index.jsx",
      content,
      language: getLanguageFromPath(path),
      path,
      editable: true,
    });
  }

  // If no structured files, treat as single entry point
  if (!hasFiles) {
    files.push({
      id: "App.jsx",
      name: "App.jsx",
      content: code,
      language: "javascript",
      path: "App.jsx",
      editable: true,
    });
  }

  return {
    files,
    entryPoint: files[0]?.path || "App.jsx",
  };
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
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
