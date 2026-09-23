import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { resolveProviderOptions } from "@/lib/openrouter";
import { getAuthUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 metadata requests per user per 10 minutes
    const rl = checkRateLimit(`metadata:${userId}`, 20, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating metadata again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const options = resolveProviderOptions(body);
    const result = await AIService.generateProjectMetadata(prompt, options);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}