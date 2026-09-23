"use client";

import {
  SandpackProvider,
  SandpackLayout,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { ReactNode, useEffect, useRef, useCallback, useMemo } from "react";
import type { FileData } from "@/types/ai";

interface SandpackWrapperProps {
  code: string;
  files?: FileData[];
  dependencies?: Record<string, string>;
  onErrorChange?: (error: string | null) => void;
  children: ReactNode;
}

function cleanErrorMessage(raw: string): string {
  if (!raw) return "";
  // Strip leading Uncaught Error prefixes
  let msg = raw.replace(/^Uncaught\s+([A-Za-z]*Error:\s*)?/, "");
  // Replace long bundler CDN bundle URLs with clean module identifiers
  msg = msg.replace(
    /https?:\/\/[^\s'"]+\/(?:node_modules\/\.vite\/deps\/)?([a-zA-Z0-9_@.-]+)\.js\?[^\s'"]*/g,
    "'$1'"
  );
  // Normalize redundant adjacent quotes if any
  msg = msg.replace(/''([a-zA-Z0-9_@.-]+)''/g, "'$1'");
  return msg.trim();
}

function SandpackErrorObserver({
  onErrorChange,
}: {
  onErrorChange?: (error: string | null) => void;
}) {
  const { sandpack, listen } = useSandpack();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeErrorRef = useRef<string | null>(null);

  const notifyError = useCallback(
    (rawError: string) => {
      const cleaned = cleanErrorMessage(rawError);
      if (!cleaned) return;

      // Don't overwrite an existing specific error with a generic render error message
      if (
        activeErrorRef.current &&
        (cleaned.includes("[PREVIEW_RENDER_ERROR]") ||
          cleaned.startsWith("The above error occurred in") ||
          cleaned === "Script error.")
      ) {
        return;
      }

      activeErrorRef.current = cleaned;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 400ms debounce ensures errors are promptly delivered to auto-fix and chat
      timerRef.current = setTimeout(() => {
        if (activeErrorRef.current) {
          onErrorChange?.(activeErrorRef.current);
        }
      }, 400);
    },
    [onErrorChange]
  );

  const clearError = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activeErrorRef.current = null;
    onErrorChange?.(null);
  }, [onErrorChange]);

  // 1. Listen to Sandpack internal bundler errors
  useEffect(() => {
    if (sandpack.error) {
      notifyError(sandpack.error.message);
    }
  }, [sandpack.error, notifyError]);

  // 2. Listen to Sandpack protocol messages
  useEffect(() => {
    const unsubscribe = listen((message: any) => {
      if (message.type === "action" && message.action === "show-error") {
        const msg = message.title || message.message;
        if (msg) notifyError(msg);
      } else if (
        message.type === "action" &&
        message.action === "notification" &&
        message.notificationType === "error"
      ) {
        if (message.title) notifyError(message.title);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [listen, notifyError]);

  // 3. Listen to cross-frame postMessage events sent from /public/index.html and /index.js
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "SANDPACK_PREVIEW_ERROR") {
        const msg = event.data.message;
        if (msg) {
          notifyError(msg);
        }
      } else if (event.data.type === "SANDPACK_PREVIEW_SUCCESS") {
        // Only clear when there are genuinely no bundler or runtime errors
        if (!sandpack.error) {
          clearError();
        }
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => {
      window.removeEventListener("message", handleWindowMessage);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [sandpack.error, clearError, notifyError]);

  return null;
}

type SandpackFileEntry = { code: string; hidden?: boolean };
type SandpackFileMap = Record<string, SandpackFileEntry>;

/**
 * Base files that lay the foundation for the React + Tailwind in-memory live preview environment.
 */
export const BASE_FILES: SandpackFileMap = {
  "/index.js": {
    code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import * as AppModule from './src/App.jsx';
import './src/index.css';
import './styles.css';

const App = AppModule.default || AppModule.App || Object.values(AppModule).find(v => typeof v === 'function') || (() => React.createElement('div', { className: 'p-8 text-center font-mono text-gray-400' }, 'Component rendered.'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    try {
      const errorMsg = error?.stack || error?.message || String(error);
      const componentStack = errorInfo?.componentStack || "";
      window.parent.postMessage({
        type: "SANDPACK_PREVIEW_ERROR",
        message: errorMsg + (componentStack ? "\\nComponent Stack:" + componentStack : "")
      }, "*");
    } catch(e) {}
  }
  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error);
      const stack = this.state.error?.stack || this.state.errorInfo?.componentStack || "";
      return (
        <div style={{ padding: '24px', color: '#f87171', fontFamily: 'monospace', backgroundColor: '#090d16', minHeight: '100vh', border: '1px solid #ef4444' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#fca5a5' }}>⚡ [PREVIEW_RENDER_ERROR]</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5', color: '#fecaca', marginBottom: '12px' }}>{errorMsg}</pre>
          {stack && <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px', color: '#9ca3af', maxHeight: '200px', overflow: 'auto' }}>{stack}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}

function SuccessNotifier() {
  React.useEffect(() => {
    try {
      window.parent.postMessage({ type: "SANDPACK_PREVIEW_SUCCESS" }, "*");
    } catch(e) {}
  }, []);
  return null;
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
          <SuccessNotifier />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
} catch (err) {
  try {
    window.parent.postMessage({
      type: "SANDPACK_PREVIEW_ERROR",
      message: err?.stack || err?.message || String(err)
    }, "*");
  } catch(e) {}
}`,
    hidden: true,
  },
  "/public/index.html": {
    code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Website Builder</title>
    <!-- Tailwind CSS CDN for instant real-time styling in preview -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      try {
        window.tailwind = window.tailwind || {};
        tailwind.config = {
          darkMode: 'class',
          theme: { extend: {} },
        };
      } catch(e) {}
    </script>
    <script>
      (function() {
        function notifyError(err) {
          try {
            window.parent.postMessage({
              type: "SANDPACK_PREVIEW_ERROR",
              message: String(err)
            }, "*");
          } catch (e) {}
        }

        // Catch uncaught module/syntax/runtime errors
        window.addEventListener('error', function(event) {
          var msg = event.message;
          if (!msg && event.error) {
            msg = event.error.message || String(event.error);
          }
          if (!msg && event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
            msg = "Failed to load resource: " + (event.target.src || event.target.href);
          }
          if (msg) notifyError(msg);
        }, true);

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', function(event) {
          var msg = event.reason ? (event.reason.message || event.reason.stack || String(event.reason)) : "Unhandled Promise Rejection";
          notifyError(msg);
        });

        // Intercept console.error for React error boundaries & bundler errors
        var origError = console.error;
        console.error = function() {
          origError.apply(console, arguments);
          var parts = [];
          for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            if (arg instanceof Error) {
              parts.push(arg.message || arg.stack);
            } else if (typeof arg === 'object' && arg !== null) {
              try { parts.push(JSON.stringify(arg)); } catch(e) { parts.push(String(arg)); }
            } else {
              parts.push(String(arg));
            }
          }
          var combined = parts.join(' ');
          if (
            combined.includes("doesn't provide an export") ||
            combined.includes("The requested module") ||
            combined.includes("Uncaught") ||
            combined.includes("is not defined") ||
            combined.includes("Cannot read propert") ||
            combined.includes("Failed to resolve")
          ) {
            notifyError(combined);
          }
        };
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    hidden: true,
  },
  "/App.js": {
    code: `import * as AppModule from "./src/App.jsx";
const App = AppModule.default || AppModule.App || Object.values(AppModule).find(v => typeof v === 'function');
export default App;`,
    hidden: true,
  },
  "/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}`,
    hidden: true,
  },
  "/src/App.jsx": {
    code: `export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold">Ready to render...</h1>
    </div>
  );
}`,
    hidden: false,
  },
  "/src/index.css": {
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}`,
    hidden: true,
  },
};

const BUILD_ONLY_DEPENDENCIES = new Set([
  "tailwindcss",
  "@tailwindcss/vite",
  "@tailwindcss/postcss",
  "@tailwindcss/typography",
  "@tailwindcss/forms",
  "postcss",
  "postcss-load-config",
  "autoprefixer",
  "vite",
  "@vitejs/plugin-react",
  "@vitejs/plugin-react-swc",
]);

export default function SandpackWrapper({
  files,
  children,
  dependencies,
  onErrorChange,
}: SandpackWrapperProps) {
  const sandpackFiles: SandpackFileMap = { ...BASE_FILES };

  const safeDependencies = useMemo(() => {
    const filtered: Record<string, string> = {};
    if (dependencies) {
      for (const [key, value] of Object.entries(dependencies)) {
        if (!BUILD_ONLY_DEPENDENCIES.has(key)) {
          filtered[key] = value;
        }
      }
    }
    return {
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "lucide-react": "^0.475.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^2.6.0",
      ...filtered,
    };
  }, [dependencies]);

  const customSetup = useMemo(
    () => ({
      dependencies: safeDependencies,
      entry: "/index.js",
    }),
    [safeDependencies]
  );

  if (files && files.length > 0) {
    // Merge provided files — normalize paths to absolute sandpack keys
    files.forEach((file) => {
      const key = file.name.startsWith("/") ? file.name : `/${file.name}`;
      // Never pass build/config files or internal entry wrappers to the in-browser Sandpack bundler.
      // Sandpack handles dependencies via customSetup.dependencies, and Tailwind via CDN.
      if (
        key === "/package.json" ||
        key === "/package-lock.json" ||
        key === "/index.html" ||
        key === "/public/index.html" ||
        key === "/src/main.jsx" ||
        key === "/index.js" ||
        key === "/App.js" ||
        key === "/vite.config.js" ||
        key === "/vite.config.ts" ||
        key === "/postcss.config.js" ||
        key === "/tailwind.config.js"
      ) {
        return;
      }
      sandpackFiles[key] = { code: file.content, hidden: false };
    });

    // If project has App.jsx at root instead of /src/App.jsx, ensure /src/App.jsx is mapped
    if (sandpackFiles["/App.jsx"] && !sandpackFiles["/src/App.jsx"]) {
      sandpackFiles["/src/App.jsx"] = sandpackFiles["/App.jsx"];
    }
  }

  const customTheme = {
    colors: {
      surface1: "#05080c",
      surface2: "#0a0f16",
      surface3: "#1a202c",
      clickable: "#a0aec0",
      base: "#cbd5e0",
      disabled: "#4a5568",
      hover: "#e6fffa",
      accent: "#4fd1c5",
      error: "#e53e3e",
      errorSurface: "#fff5f5",
    },
    syntax: {
      plain: "#e2e8f0",
      comment: { color: "#718096", fontStyle: "italic" as const },
      keyword: "#4fd1c5",
      tag: "#9deee5",
      punctuation: "#a0aec0",
      definition: "#c9f7f0",
      property: "#6bdfd3",
      static: "#cbd5e0",
      string: "#68d391",
    },
    font: {
      body: "var(--font-sans), sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      size: "12px",
      lineHeight: "20px",
    },
  };

  const sandpackOptions = useMemo(
    () => ({
      autorun: true,
      autoReload: false,
      activeFile: "/src/App.jsx",
      externalResources: ["https://cdn.tailwindcss.com"],
    }),
    []
  );

  return (
    <SandpackProvider
      template="react"
      files={sandpackFiles}
      customSetup={customSetup}
      theme={customTheme}
      options={sandpackOptions}
    >
      <SandpackErrorObserver onErrorChange={onErrorChange} />
      <SandpackLayout style={{ height: "100%", background: "transparent", border: "none", borderRadius: 0 }}>
        {children}
      </SandpackLayout>
    </SandpackProvider>
  );
}