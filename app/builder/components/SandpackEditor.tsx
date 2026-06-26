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

  // console.log("Sandpack files:", files);

  return (
    <SandpackProvider
      template="react"
      files={files}
      customSetup={{
        dependencies: {
          react: "latest",
          "react-dom": "latest",
        },
      }}
      theme="light"
      options={{
        autorun: true,
        autoReload: true,
      }}
    >
      <SandpackLayout style={{ height: "600px" }}>
        {showBothPanels && (
          <SandpackCodeEditor />
        )}
        <SandpackPreview />
      </SandpackLayout>
    </SandpackProvider>
  );
}
