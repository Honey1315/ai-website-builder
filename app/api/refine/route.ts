import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { resolveProviderOptions } from "@/lib/openrouter";
import type { FileData } from "@/types/ai";
import type { ProjectManifest } from "@/types/contract";
import { getAuthUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 refinements per user per 10 minutes
    const rl = checkRateLimit(`refine:${userId}`, 30, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before refining again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

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

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message exceeds maximum length of 4000 characters" },
        { status: 400 }
      );
    }

    if (!code && (!files || files.length === 0)) {
      return NextResponse.json(
        { error: "Code or files are required" },
        { status: 400 }
      );
    }

    const options = resolveProviderOptions(body);

    const result = await AIService.refineCode(message, {
      prompt,
      structure,
      manifest,
      files,
      code,
    }, options);

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