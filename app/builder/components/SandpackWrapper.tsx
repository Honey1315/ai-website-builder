"use client";

import {
  SandpackProvider,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { ReactNode } from "react";
import type { FileData } from "@/types/ai";

interface SandpackWrapperProps {
  code: string;
  files?: FileData[];
  dependencies?: Record<string, string>;
  children: ReactNode;
}

type SandpackFileEntry = { code: string; hidden?: boolean };
type SandpackFileMap = Record<string, SandpackFileEntry>;

/**
 * Base files that are always present but hidden from the editor.
 * These are the lowest-priority defaults — any file in the `files` prop
 * with the same key will override them.
 */
export const BASE_FILES: SandpackFileMap = {
  "/src/index.js": {
    code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    hidden: true,
  },
  "/public/index.html": {
    code: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AI Website Builder</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    hidden: true,
  },
  "/src/App.jsx" : {
    code: `import React from 'react';
export default function App() {
  return <div>Ready to render...</div>;
}`,
    hidden: false,
  },
  "/src/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}`,
    hidden: true,
  },
};

/**
 * Default minimal global CSS — only used when no CSS file is provided.
 */
const DEFAULT_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
}`;

export default function SandpackWrapper({
  files,
  children,
  dependencies,
}: SandpackWrapperProps) {
  // Start with the hidden base files (entrypoint + html)
  const sandpackFiles: SandpackFileMap = { ...BASE_FILES };
  const DEFAULT_DEPENDENCIES = {
    react: "latest",
    "react-dom": "latest",
    "react-is" : "latest",
  };

  const latestDependencies: Record<string, string> = Object.fromEntries(
    Object.keys(dependencies ?? {}).map((key) => [key, "latest"])
  );

  if (files && files.length > 0) {
    // Merge provided files — normalise paths to absolute sandpack keys
    files.forEach((file) => {
      const key = file.name.startsWith("/") ? file.name : `/${file.name}`;
      sandpackFiles[key] = { code: file.content, hidden: false };
    });

    // If no CSS file was provided, inject the default global CSS so
    // the /index.js import of './src/styles.css' doesn't 404.
    const hasCss = files.some((f) => f.name.endsWith(".css"));
    if (!hasCss) {
      sandpackFiles["/src/styles.css"] = { code: DEFAULT_CSS, hidden: true };
    }
  }

  // Custom technical theme for Sandpack
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
      comment: { color: "#718096", fontStyle: "italic" },
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

  return (
    <SandpackProvider
      template="react"
      files={sandpackFiles}
      customSetup={{
        entry: "/src/index.js",
        dependencies: {
          ...DEFAULT_DEPENDENCIES,
          ...latestDependencies,
        },
      }}
      theme={customTheme}
      options={{
        autorun: true,
        autoReload: true,
        activeFile: "/src/App.jsx",
      }}
    >
      <SandpackLayout style={{ height: "100%", background: "transparent", border: "none", borderRadius: 0 }}>
        {children}
      </SandpackLayout>
    </SandpackProvider>
  );
}