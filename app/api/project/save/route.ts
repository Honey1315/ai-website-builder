import { NextRequest, NextResponse } from "next/server";
import { Project } from "@/types/project";
import { prisma } from "@/lib/prisma";
import { FileData } from "@/types/ai";
import { getUser, getAuthUserId, verifyProjectOwnership } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const supabaseUser = await getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = supabaseUser.id;

    const projectData: Project = await request.json();
    if (!projectData.id || !projectData.name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
        { status: 400 }
      );
    }

    if (projectData.id) {
      const existingProject = await prisma.projects.findUnique({
        where: { id: projectData.id },
        select: { user_id: true },
      });

      if (existingProject && existingProject.user_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this project" },
          { status: 403 }
        );
      }
    }


    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name ||
          supabaseUser.email?.split('@')[0] ||
          'User',
        image: supabaseUser.user_metadata?.avatar_url ||
          supabaseUser.user_metadata?.picture ||
          null,
        createdat: new Date(),
        updatedat: new Date(),
      },
    });


    const result = await prisma.$transaction(
      async (tx) => {
        const project = await tx.projects.upsert({
          where: { id: projectData.id },
          update: {
            name: projectData.name,
            description: projectData.description,
            ...(projectData.prompt !== undefined ? { prompt: projectData.prompt } : {}),
            ...(projectData.github_link !== undefined ? { github_link: projectData.github_link } : {}),
            ...(projectData.vercel_link !== undefined ? { vercel_link: projectData.vercel_link } : {}),
            updated_at: new Date(),
          },
          create: {
            id: projectData.id,
            name: projectData.name,
            description: projectData.description,
            prompt: projectData.prompt ?? null,
            github_link: projectData.github_link ?? null,
            vercel_link: projectData.vercel_link ?? null,
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        await tx.project_files.deleteMany({
          where: { project_id: project.id },
        });

        if (projectData.files && projectData.files.length > 0) {
          await tx.project_files.createMany({
            data: projectData.files.map((file: FileData) => ({
              project_id: project.id,
              path: file.name,
              content: file.content,
              language: file.language,
              editable: true,
            })),
          });
        }

        if (projectData.messages && projectData.messages.length > 0) {
          await tx.messages.deleteMany({
            where: { project_id: project.id },
          });

          await tx.messages.createMany({
            data: projectData.messages.map((msg) => ({
              project_id: project.id,
              role: msg.role,
              content: msg.content,
              created_at: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            })),
          });
        }

        return project;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    const projectWithFiles = await prisma.projects.findUnique({
      where: { id: result.id },
      include: {
        project_files: true,
        messages: { orderBy: { created_at: "asc" } },
      },
    });


    if (!projectWithFiles) {
      throw new Error("Project not found after upsert");
    }


    const responseProject: Project = {
      id: projectWithFiles.id,
      name: projectWithFiles.name,
      description: projectWithFiles.description ?? undefined,
      prompt: projectWithFiles.prompt ?? undefined,
      code: "",
      files: (projectWithFiles as any).project_files.map((file: any) => ({
        name: file.path,
        content: file.content,
        language: file.language ?? undefined,
      })),
      messages: ((projectWithFiles as any).messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
      })),
      createdAt: projectWithFiles.created_at,
      updatedAt: projectWithFiles.updated_at,
      userId: projectWithFiles.user_id,
      isPublic: false,
      github_link: projectWithFiles.github_link ?? undefined,
      vercel_link: projectWithFiles.vercel_link ?? undefined,
    };

    return NextResponse.json(responseProject);
  } catch (error) {
    console.error("Error saving project:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, github_link, vercel_link } = body as {
      id?: string;
      name?: string;
      description?: string | null;
      github_link?: string | null;
      vercel_link?: string | null;
    };

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Project name cannot be empty" },
        { status: 400 }
      );
    }

    const existing = await prisma.projects.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this project" },
        { status: 403 }
      );
    }

    const updated = await prisma.projects.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim().slice(0, 255) } : {}),
        ...(description !== undefined
          ? { description: typeof description === "string" ? (description.trim() || null) : null }
          : {}),
        ...(github_link !== undefined ? { github_link } : {}),
        ...(vercel_link !== undefined ? { vercel_link } : {}),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updated.id,
        name: updated.name,
        description: updated.description ?? null,
        github_link: updated.github_link ?? undefined,
        vercel_link: updated.vercel_link ?? undefined,
        updatedAt: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("id");

    if (projectId) {
      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        include: {
          project_files: true,
          messages: { orderBy: { created_at: "asc" } },
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      if (project.user_id !== userId) {
        return NextResponse.json(
          { error: "Forbidden: You do not own this project" },
          { status: 403 }
        );
      }

      const projectResponse: Project = {
        id: project.id,
        name: project.name,
        description: project.description ?? undefined,
        prompt: project.prompt ?? undefined,
        code: "",
        files: (project as any).project_files.map((file: any) => ({
          name: file.path,
          content: file.content,
          language: file.language ?? undefined,
        })),
        messages: ((project as any).messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
        })),
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        userId: project.user_id,
        github_link: project.github_link ?? undefined,
        vercel_link: project.vercel_link ?? undefined,
      };

      return NextResponse.json(projectResponse);
    }

    const projects = await prisma.projects.findMany({
      where: { user_id: userId },
      include: {
        project_files: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    const projectsResponse: Project[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? undefined,
      prompt: project.prompt ?? undefined,
      code: "",
      files: (project as any).project_files.map((file: any) => ({
        name: file.path,
        content: file.content,
        language: file.language ?? undefined,
      })),
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      userId: project.user_id,
      isPublic: false,
      github_link: project.github_link ?? undefined,
      vercel_link: project.vercel_link ?? undefined,
    }));

    return NextResponse.json(projectsResponse);
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this project" },
        { status: 403 }
      );
    }

    await prisma.projects.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === 'Project not found') {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}