import { NextRequest, NextResponse } from "next/server";
import { FileData } from "@/types/ai";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-github-token");
    if (!token) {
      return NextResponse.json({ error: "Missing GitHub token" }, { status: 401 });
    }

    const { projectName, files, repoName } = await request.json();
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files to deploy" }, { status: 400 });
    }

    const finalRepoName = repoName || projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-') || "ai-website";

    // 1. Create Repository
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
          auto_init: true, // Initialize with a README/initial commit
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

    // Wait a brief moment for auto-init to complete on GitHub's side
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Get latest commit SHA on main/master
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

    // 3. Get base tree SHA
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

    // 4. Create Tree with all files
    const treeItems = files.map((file: FileData) => {
      // Fix file path if it starts with /
      const filePath = file.name.startsWith("/") ? file.name.slice(1) : file.name;
      
      let normalizedPath = filePath;
      // If it's already a root file or in public/, don't prepend src/
      if (filePath !== "package.json" && !filePath.startsWith("public/")) {
        normalizedPath = `src/${filePath}`;
      }
      
      return {
        path: normalizedPath,
        mode: "100644",
        type: "blob",
        content: file.content,
      };
    });

    // Add package.json explicitly if not provided
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
          dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
          },
          scripts: {
            "start": "react-scripts start",
            "build": "react-scripts build",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
          }
        }, null, 2)
      });
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
    
    if(!createTreeRes.ok) {
        return NextResponse.json({ error: "Failed to create git tree" }, { status: 500 });
    }
    const treeData = await createTreeRes.json();

    // 5. Create Commit
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
    
    if(!createCommitRes.ok) {
        return NextResponse.json({ error: "Failed to create commit" }, { status: 500 });
    }
    const newCommitData = await createCommitRes.json();

    // 6. Update Reference
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

    if(!updateRefRes.ok) {
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
