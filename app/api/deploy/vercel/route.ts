import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-vercel-token");
    if (!token) {
      return NextResponse.json({ error: "Missing Vercel token" }, { status: 401 });
    }

    const { repoFullName, projectName, framework = "create-react-app", repoId: bodyRepoId } = await request.json();
    if (!repoFullName) {
      return NextResponse.json({ error: "Missing GitHub repository full name" }, { status: 400 });
    }

    const finalProjectName = (projectName || "ai-website").toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100);

    // 1. Create Vercel Project
    const createProjectRes = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: finalProjectName,
        framework,
        gitRepository: {
          type: "github",
          repo: repoFullName,
        },
      }),
    });

    // If 409, it might already exist. We can try to proceed anyway.
    if (!createProjectRes.ok && createProjectRes.status !== 409) {
      const errorData = await createProjectRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to create Vercel project: ${errorData.error?.message || createProjectRes.statusText}` },
        { status: createProjectRes.status }
      );
    }
    
    // We don't strictly need the project ID to deploy, the repoId + name is enough in v13

    // Get the repo ID from GitHub to use for gitSource
    const githubRes = await fetch(`https://api.github.com/repos/${repoFullName}`, {
       headers: {
          "Accept": "application/vnd.github.v3+json",
          // Don't need auth just for public repo ID, but we might if it's private.
          // Since we created it, we can fetch it if we pass the same token, but we don't have it here.
          // Better: pass repoId from the client. Let's adjust the frontend to pass it.
       }
    });

    let repoId = bodyRepoId;
    if (!repoId) {
        const ghData = await githubRes.json();
        repoId = ghData.id;
    }

    if (!repoId) {
        return NextResponse.json({ error: "Could not resolve GitHub Repository ID" }, { status: 400 });
    }

    // 2. Trigger Deployment
    const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: finalProjectName,
        gitSource: {
          type: "github",
          repoId: repoId.toString(),
          ref: "main",
        },
        projectSettings: {
          framework,
        },
      }),
    });

    if (!deployRes.ok) {
      const errorData = await deployRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Failed to trigger deployment: ${errorData.error?.message || deployRes.statusText}` },
        { status: deployRes.status }
      );
    }

    const deployData = await deployRes.json();

    return NextResponse.json({
      projectUrl: `https://vercel.com/${deployData.creator?.username || 'user'}/${finalProjectName}`,
      deploymentUrl: deployData.url ? `https://${deployData.url}` : null,
      deploymentId: deployData.id,
    });

  } catch (error: any) {
    console.error("Vercel deploy error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
