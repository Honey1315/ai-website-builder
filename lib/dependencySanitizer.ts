/**
 * Catalog of verified, stable semver versions for popular React packages
 * frequently hallucinated with inverted or transposed digits by LLMs
 * (e.g. canvas-confetti ^19.4.0 -> ^1.9.4, framer-motion ^15.0.0 -> ^11.18.0).
 */
export const KNOWN_PACKAGE_VERSIONS: Record<string, string> = {
  // Core baseline
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  
  // Visual effects & animations
  "canvas-confetti": "^1.9.4",
  "@types/canvas-confetti": "^1.9.0",
  "framer-motion": "^11.18.0",
  "three": "^0.173.0",
  "@types/three": "^0.173.0",

  // UI & Icons
  "lucide-react": "^0.475.0",
  "react-icons": "^5.4.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0",
  "cmdk": "^1.0.0",
  "sonner": "^1.7.4",

  // Charts & Data
  "recharts": "^2.15.0",
  "chart.js": "^4.4.7",
  "react-chartjs-2": "^5.3.0",

  // State & Utilities
  "zustand": "^5.0.3",
  "date-fns": "^4.1.0",
  "lodash": "^4.17.21",
  "axios": "^1.7.9",
};

/**
 * Extracts the root package name from an import path.
 * e.g. "canvas-confetti/dist/confetti" -> "canvas-confetti"
 * e.g. "@heroicons/react/24/outline" -> "@heroicons/react"
 * Returns empty string for relative or absolute paths.
 */
export function extractPackageName(importPath: string): string {
  const trimmed = importPath.trim();
  if (trimmed.startsWith(".") || trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("@")) {
    const parts = trimmed.split("/");
    return parts.slice(0, 2).join("/");
  }
  return trimmed.split("/")[0];
}

/**
 * Validates and sanitizes a dependency version.
 * - If the package is in the known catalog, uses the verified battle-tested semver.
 * - If the version is wild, transposed (e.g. major > 35 for low-version libraries), or malformed, defaults to "latest".
 */
export function sanitizePackageVersion(name: string, rawVersion: unknown): string {
  const pkgName = name.trim().toLowerCase();

  // 1. Check verified catalog first (guarantees e.g. canvas-confetti is always ^1.9.4)
  if (KNOWN_PACKAGE_VERSIONS[pkgName]) {
    return KNOWN_PACKAGE_VERSIONS[pkgName];
  }

  if (typeof rawVersion !== "string" || !rawVersion.trim()) {
    return "latest";
  }

  const trimmed = rawVersion.trim();

  // 2. If it's already "latest" or "*", return "latest"
  if (trimmed === "latest" || trimmed === "*") {
    return "latest";
  }

  // 3. Detect obviously wild hallucinated major versions (e.g. ^19.4.0)
  const match = trimmed.match(/^[\^~]?(\d+)\.(\d+)(?:\.(\d+))?/);
  if (match) {
    const major = parseInt(match[1], 10);
    // If major version is suspiciously high (> 35), LLM likely transposed digits -> fallback to "latest"
    if (major > 35) {
      return "latest";
    }
    return trimmed;
  }

  // If not standard semver, fallback to "latest" so Sandpack/npm can resolve it cleanly
  return "latest";
}

/**
 * Sanitizes an entire dependencies record.
 */
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

/**
 * Scans JavaScript / JSX code strings for external package imports
 * and returns a list of unique package names.
 */
export function scanCodeForImportedPackages(code: string): string[] {
  if (!code || typeof code !== "string") return [];

  const found = new Set<string>();
  // Match standard ESM imports: import ... from '...' or import '...'
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
