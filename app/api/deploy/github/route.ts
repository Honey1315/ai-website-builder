import { NextRequest, NextResponse } from "next/server";
import { FileData } from "@/types/ai";
import { getAuthUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectName, files, repoName, tokenId } = body as {
      projectName?: string;
      files?: FileData[];
      repoName?: string;
      tokenId?: string;
    };

    let token = request.headers.get("x-github-token");
    if (!token && tokenId) {
      const savedRecord = await prisma.user_tokens.findFirst({
        where: { id: tokenId, user_id: userId, provider: "github" },
      });
      if (savedRecord) {
        token = decryptToken(savedRecord.encrypted_token);
      }
    }
    if (!token) {
      const defaultRecord = await prisma.user_tokens.findFirst({
        where: { user_id: userId, provider: "github" },
        orderBy: { updated_at: "desc" },
      });
      if (defaultRecord) {
        token = decryptToken(defaultRecord.encrypted_token);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing GitHub token. Please provide or save a GitHub token." },
        { status: 401 }
      );
    }
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files to deploy" }, { status: 400 });
    }

    const MAX_FILES = 50;
    const MAX_FILE_BYTES = 500 * 1024;
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Too many files: maximum is ${MAX_FILES}` }, { status: 400 });
    }
    for (const file of files) {
      if (typeof file.content === "string" && Buffer.byteLength(file.content, "utf8") > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 500 KB size limit` },
          { status: 400 }
        );
      }
    }


    const finalRepoName = repoName || (projectName ? projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-') : "") || "ai-website";

    let repoInfo;
    try {
      const createRepoRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finalRepoName,
          private: true,
          auto_init: true,
        }),
      });

      if (!createRepoRes.ok) {
        const errorData = await createRepoRes.json();
        return NextResponse.json(
          { error: `Failed to create repo: ${errorData.message || createRepoRes.statusText}` },
          { status: createRepoRes.status }
        );
      }
      repoInfo = await createRepoRes.json();
    } catch (err) {
      return NextResponse.json({ error: "Network error creating repository" }, { status: 500 });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    const defaultBranch = repoInfo.default_branch || "main";
    const refRes = await fetch(
      `https://api.github.com/repos/${repoInfo.owner.login}/${repoInfo.name}/git/ref/heads/${defaultBranch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!refRes.ok) {
      return NextResponse.json({ error: "Failed to fetch repository reference" }, { status: 500 });
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    const commitRes = await fetch(
      `https://api.github.com/repos/${repoInfo.owner.login}/${repoInfo.name}/git/commits/${latestCommitSha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
        },
      }
    );
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    const ROOT_FILES = new Set([
      "package.json",
      "index.html",
      "vite.config.js",
      "vite.config.ts",
      "tailwind.config.js",
      "tailwind.config.ts",
      "postcss.config.js",
      "postcss.config.mjs",
      "postcss.config.cjs",
      "README.md",
    ]);

    const treeItems = files.map((file: FileData) => {
      const filePath = file.name.startsWith("/") ? file.name.slice(1) : file.name;

      let normalizedPath = filePath;
      if (!ROOT_FILES.has(filePath) && !filePath.startsWith("public/") && !filePath.startsWith("src/")) {
        normalizedPath = `src/${filePath}`;
      }

      let content = file.content;
      if (filePath === "index.html" || normalizedPath === "index.html") {
        content = content.replace(/<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']><\/script>\s*/gi, "");
      }
      if (normalizedPath === "src/index.css" || normalizedPath === "src/styles.css") {
        if (!content.includes("@tailwind")) {
          content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${content}`;
        }
      }
      if (filePath === "package.json" || normalizedPath === "package.json") {
        try {
          const parsed = JSON.parse(content);
          parsed.devDependencies = {
            "@vitejs/plugin-react": "^4.3.4",
            "vite": "^5.4.14",
            "tailwindcss": "^3.4.17",
            "postcss": "^8.4.49",
            "autoprefixer": "^10.4.20",
            ...(parsed.devDependencies || {}),
          };
          content = JSON.stringify(parsed, null, 2);
        } catch {

        }
      }

      return {
        path: normalizedPath,
        mode: "100644",
        type: "blob",
        content,
      };
    });

    const hasPackageJson = treeItems.some((item: any) => item.path === "package.json");
    if (!hasPackageJson) {
      treeItems.push({
        path: "package.json",
        mode: "100644",
        type: "blob",
        content: JSON.stringify({
          name: finalRepoName,
          version: "0.1.0",
          private: true,
          type: "module",
          dependencies: {
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "lucide-react": "^0.475.0"
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.3.4",
            "vite": "^5.4.14",
            "tailwindcss": "^3.4.17",
            "postcss": "^8.4.49",
            "autoprefixer": "^10.4.20"
          },
          scripts: {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
          }
        }, null, 2)
      });
    }

    const hasIndexHtml = treeItems.some((item: any) => item.path === "index.html");
    if (!hasIndexHtml) {
      treeItems.push({
        path: "index.html",
        mode: "100644",
        type: "blob",
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${finalRepoName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
      });
    }

    const hasViteConfig = treeItems.some((item: any) => item.path === "vite.config.js" || item.path === "vite.config.ts");
    if (!hasViteConfig) {
      treeItems.push({
        path: "vite.config.js",
        mode: "100644",
        type: "blob",
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});`
      });
    }

    const hasTailwindConfig = treeItems.some((item: any) => item.path === "tailwind.config.js" || item.path === "tailwind.config.ts");
    if (!hasTailwindConfig) {
      treeItems.push({
        path: "tailwind.config.js",
        mode: "100644",
        type: "blob",
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};`
      });
    }

    const hasPostcssConfig = treeItems.some((item: any) => item.path === "postcss.config.js" || item.path === "postcss.config.mjs" || item.path === "postcss.config.cjs");
    if (!hasPostcssConfig) {
      treeItems.push({
        path: "postcss.config.js",
        mode: "100644",
        type: "blob",
        content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`
      });
    }

    const hasMainJsx = treeItems.some((item: any) => item.path === "src/main.jsx" || item.path === "src/main.tsx");
    if (!hasMainJsx) {
      treeItems.push({
        path: "src/main.jsx",
        mode: "100644",
        type: "blob",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      });
    }

    const existingIndexCss = treeItems.find((item: any) => item.path === "src/index.css");
    if (!existingIndexCss) {
      treeItems.push({
        path: "src/index.css",
        mode: "100644",
        type: "blob",
        content: `@tailwind base;
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
}`
      });
    } else if (!existingIndexCss.content.includes("@tailwind")) {
      existingIndexCss.content = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${existingIndexCss.content}`;
    }

    const createTreeRes = await fetch(
      `https://api.github.com/repos/${repoInfo.owner.login}/${repoInfo.name}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    if (!createTreeRes.ok) {
      return NextResponse.json({ error: "Failed to create git tree" }, { status: 500 });
    }
    const treeData = await createTreeRes.json();

    const createCommitRes = await fetch(
      `https://api.github.com/repos/${repoInfo.owner.login}/${repoInfo.name}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Initial commit from AI Website Builder",
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    if (!createCommitRes.ok) {
      return NextResponse.json({ error: "Failed to create commit" }, { status: 500 });
    }
    const newCommitData = await createCommitRes.json();

    const updateRefRes = await fetch(
      `https://api.github.com/repos/${repoInfo.owner.login}/${repoInfo.name}/git/refs/heads/${defaultBranch}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: true,
        }),
      }
    );

    if (!updateRefRes.ok) {
      return NextResponse.json({ error: "Failed to update branch reference" }, { status: 500 });
    }

    return NextResponse.json({
      repoUrl: repoInfo.html_url,
      repoFullName: repoInfo.full_name,
      repoId: repoInfo.id,
    });

  } catch (error: any) {
    console.error("GitHub deploy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
