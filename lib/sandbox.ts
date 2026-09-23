import { FileData } from "@/types/ai";

export function createSandpackFiles(code: string, files?: FileData[]) {
  const sandpackFiles: Record<string, { code: string; hidden?: boolean }> = {
    "/index.html": {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Website Builder</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      hidden: true,
    },
    "/vite.config.js": {
      code: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`,
      hidden: true,
    },
    "/src/main.jsx": {
      code: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      hidden: true,
    },
    "/src/index.css": {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      hidden: true,
    },
    "/src/App.jsx": {
      code:
        code ||
        `export default function App() { return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white"><h1 className="text-xl font-bold">Ready...</h1></div>; }`,
      hidden: false,
    },
    "/package.json": {
      code: `{
  "name": "ai-generated-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "lucide-react": "^0.475.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.2",
    "framer-motion": "^12.4.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^5.4.14"
  }
}`,
      hidden: true,
    },
  };

  // Merge additional files - normalize paths to absolute sandpack keys
  if (files && files.length > 0) {
    files.forEach((file) => {
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