import { NextRequest, NextResponse } from "next/server";
import { Project } from "@/types/project";

// In-memory storage (replace with database)
const projects: Map<string, Project> = new Map();

export async function POST(request: NextRequest) {
  try {
    const project: Project = await request.json();

    if (!project.id || !project.name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
        { status: 400 }
      );
    }

    projects.set(project.id, {
      ...project,
      updatedAt: new Date(),
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all projects or single project by ID
    const projectId = request.nextUrl.searchParams.get("id");

    if (projectId) {
      const project = projects.get(projectId);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    return NextResponse.json(Array.from(projects.values()));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    projects.delete(projectId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
