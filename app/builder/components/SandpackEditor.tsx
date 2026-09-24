"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from "@codesandbox/sandpack-react";

interface SandpackEditorProps {
  code: string;
  setCode: (code: string) => void;
  showBothPanels?: boolean;
}

export default function SandpackEditor({
  code,
  setCode,
  showBothPanels = false,
}: SandpackEditorProps) {
  const files = {
    "/App.jsx": {
      code: code || '// Your code will appear here\nexport default function App() {\n  return <div>Ready to render...</div>;\n}',
      hidden: false,
    },
    "/index.js": {
      code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      hidden: true,
    },
    "/index.css": {
      code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      hidden: true,
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="AI Website Builder"
    />
    <title>AI Website Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
      hidden: true,
    },
  };

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

  return (
    <div className="border border-secondary-800 bg-[#05080c] relative group">
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-secondary-700 opacity-50 z-10 pointer-events-none"></div>

      <SandpackProvider
        template="react"
        files={files}
        customSetup={{
          dependencies: {
            react: "latest",
            "react-dom": "latest",
          },
        }}
        theme={customTheme}
        options={{
          autorun: true,
          autoReload: true,
        }}
      >
        <SandpackLayout style={{ height: "600px", borderRadius: 0, border: "none" }}>
          {showBothPanels && (
            <SandpackCodeEditor style={{ height: "100%" }} />
          )}
          <SandpackPreview style={{ height: "100%", background: "#ffffff" }} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}