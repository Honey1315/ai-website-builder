
export const KNOWN_PACKAGE_VERSIONS: Record<string, string> = {

  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "canvas-confetti": "^1.9.4",
  "@types/canvas-confetti": "^1.9.0",
  "framer-motion": "^11.18.0",
  "three": "^0.173.0",
  "@types/three": "^0.173.0",
  "lucide-react": "^0.475.0",
  "react-icons": "^5.4.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "cmdk": "^1.0.0",
  "sonner": "^1.7.4",
  "recharts": "^2.15.0",
  "chart.js": "^4.4.7",
  "react-chartjs-2": "^5.3.0",
  "zustand": "^5.0.3",
  "date-fns": "^4.1.0",
  "lodash": "^4.17.21",
  "axios": "^1.7.9",
};


export function extractPackageName(importPath: string): string {
  const trimmed = importPath.trim();
  if (trimmed.startsWith(".") || trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("@")) {
    const parts = trimmed.split("/");
    return parts.slice(0, 2).join("/");
  }
  return trimmed.split("/")[0];
}


export function sanitizePackageVersion(name: string, rawVersion: unknown): string {
  const pkgName = name.trim().toLowerCase();

  if (KNOWN_PACKAGE_VERSIONS[pkgName]) {
    return KNOWN_PACKAGE_VERSIONS[pkgName];
  }

  if (typeof rawVersion !== "string" || !rawVersion.trim()) {
    return "latest";
  }

  const trimmed = rawVersion.trim();

  if (trimmed === "latest" || trimmed === "*") {
    return "latest";
  }

  const match = trimmed.match(/^[\^~]?(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    if (major > 35) {
      return "latest";
    }
    return trimmed;
  }
  return "latest";
}

export function sanitizeDependencies(
  deps: Record<string, unknown> | undefined | null
): Record<string, string> {
  if (!deps || typeof deps !== "object" || Array.isArray(deps)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(deps)) {
    const name = rawKey.trim();
    if (!name || name.startsWith("internal:") || name.startsWith("/")) continue;
    result[name] = sanitizePackageVersion(name, rawVal);
  }

  return result;
}


export function scanCodeForImportedPackages(code: string): string[] {
  if (!code || typeof code !== "string") return [];

  const found = new Set<string>();
  const importRegex = /(?:import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'".\/][^'"]*)['"]|require\(['"]([^'".\/][^'"]*)['"]\))/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(code)) !== null) {
    const rawPath = match[1] || match[2];
    if (rawPath) {
      const pkg = extractPackageName(rawPath);
      if (pkg && pkg !== "react" && pkg !== "react-dom") {
        found.add(pkg);
      }
    }
  }

  return Array.from(found);
}
