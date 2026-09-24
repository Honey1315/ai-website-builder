import { NextRequest, NextResponse } from "next/server";
import { createProjectZip } from "@/lib/zipExporter";
import { FileData } from "@/types/ai";
import { getAuthUserId } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectName, code, files } = await request.json();

    if (!projectName || !code) {
      return NextResponse.json(
        { error: "Project name and code are required" },
        { status: 400 }
      );
    }

    const zipBlob = await createProjectZip(
      projectName,
      files || [],
      code
    );

    return new NextResponse(zipBlob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${projectName}.zip"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}