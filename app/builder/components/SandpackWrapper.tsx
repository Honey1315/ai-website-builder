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
  children: ReactNode;
}

type SandpackFileMap = Record<string, { code: string; hidden?: boolean }>;

const DEFAULT_FILES = {
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

  "/src/styles.css": {
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
}`,
    hidden: true,
  },

  "/public/index.html": {
    code: `<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
  </body>
</html>`,
    hidden: true,
  },
};

export default function SandpackWrapper({
  code,
  files,
  children,
}: SandpackWrapperProps) {
  const sandpackFiles: SandpackFileMap = {
    ...DEFAULT_FILES,
  };

  if (files && files.length > 0) {
    files.forEach((file) => {
      sandpackFiles[`/${file.name}`] = {
        code: file.content,
        hidden: false,
      };
    });
  } else {
    sandpackFiles["/src/App.jsx"] = {
      code:
        code ||
        `export default function App() {
  return <div>Ready to render...</div>;
}`,
      hidden: false,
    };
  }

  // console.log("Sandpack files:", sandpackFiles);

  return (
    <SandpackProvider
      template="react"
      files={sandpackFiles}
      customSetup={{
        dependencies: {
          react: "latest",
          "react-dom": "latest",
          "react-beautiful-dnd": "latest",
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
