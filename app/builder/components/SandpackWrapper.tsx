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
const BASE_FILES: SandpackFileMap = {
  "/index.js": {
    code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.jsx';
import './src/styles.css';

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
};

/**
 * Default App.jsx shown before any code is generated.
 */
const DEFAULT_APP = `export default function App() {
  return <div>Ready to render...</div>;
}`;

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
  // code,
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
  // console.log("dependencies: ", dependencies);
  // console.log("code prop: ", code);
  console.log("files prop: ", files);
  console.log("dependencies prop: ", dependencies);

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

  //   // If no App.jsx was provided among the files, fall back to code prop
  //   const hasApp = files.some(
  //     (f) => f.name === "src/App.jsx" || f.name === "/src/App.jsx"
  //   );
  //   if (!hasApp) {
  //     sandpackFiles["/src/App.jsx"] = {
  //       code: code || DEFAULT_APP,
  //       hidden: false,
  //     };
  //   }
  // } else {
  //   // No files at all — use code prop as App.jsx + default CSS
  //   sandpackFiles["/src/App.jsx"] = {
  //     code: code || DEFAULT_APP,
  //     hidden: false,
  //   };
  //   sandpackFiles["/src/styles.css"] = { code: DEFAULT_CSS, hidden: true };
  }

  return (
    <SandpackProvider
      template="react"
      files={sandpackFiles}
      customSetup={{
        dependencies: {
          ...DEFAULT_DEPENDENCIES,
          ...latestDependencies,
        },
      }}
      theme="dark"
      options={{
        autorun: true,
        autoReload: true,
        activeFile: "/src/App.jsx",
      }}
    >
      <SandpackLayout style={{ height: "100%" }}>
        {children}
      </SandpackLayout>
    </SandpackProvider>
  );
}
