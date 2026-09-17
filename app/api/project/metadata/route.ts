import { NextRequest, NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { resolveProviderOptions } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
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