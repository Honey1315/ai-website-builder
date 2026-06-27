import { FileData } from "@/types/ai";

export function createSandpackFiles(code: string, files?: FileData[]) {
  const sandpackFiles: Record<string, { code: string; hidden?: boolean }> = {
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto';
  -webkit-font-smoothing: antialiased;
}`,
      hidden: false,
    },
    "/public/index.html": {
      code: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>AI Website Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      hidden: true,
    },
    "/src/App.jsx": {
      code:
        code ||
        `export default function App() { return <div>Ready...</div>; }`,
      hidden: false,
    },
  };

  // Merge additional files — only overwrite keys that the files array specifies
  if (files && files.length > 0) {
    files.forEach((file) => {
      // Normalise to absolute sandpack path (e.g. "src/App.jsx" -> "/src/App.jsx")
      const key = file.name.startsWith("/") ? file.name : `/${file.name}`;
      sandpackFiles[key] = {
        code: file.content,
        hidden: false,
      };
    });
  }

  return sandpackFiles;
}

export function validateSandpackEnvironment(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof fetch !== "undefined" &&
    typeof Promise !== "undefined"
  );
}
