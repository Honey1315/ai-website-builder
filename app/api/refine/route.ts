import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import type { FileData } from "@/types/ai";
import type { ProjectManifest } from "@/types/contract";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      message,
      prompt,
      structure,
      manifest,
      files,
    } = body as {
      code?: string;
      message?: string;
      prompt?: string;
      structure?: string[];
      manifest?: ProjectManifest;
      files?: FileData[];
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!code && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "Code or files are required" },
        { status: 400 }
      );
    }

    const result = await AIService.refineCode(message, {
      prompt,
      structure,
      manifest,
      files,
      code,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
