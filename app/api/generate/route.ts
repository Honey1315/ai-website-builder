import { NextRequest, NextResponse } from "next/server";

import { AIService } from "@/services/ai.service";

import { getLanguageFromFilename } from "@/lib/extractCode";

import { resolveProviderOptions } from "@/lib/openrouter";

import { getAuthUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { localFileSummary } from "@/lib/extractFileSummary";

import type { ProviderOptions, FileData, GenerateStreamEvent } from "@/types/ai";
export type { GenerateStreamEvent };

import {
  isCodegenFile,
  orderedManifestFiles,
  ensureMissingImportsExist,
  isPlaceholderFile,
} from "@/lib/contractHelpers";

import { getAffectedFiles } from "@/lib/contractValidation";

import type {
  FileSummary,
  ProjectManifest,
} from "@/types/contract";

const GENERATION_PACE_MS = 550;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



const encoder = new TextEncoder();



function streamEvent(event: GenerateStreamEvent) {

  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

}



function componentNameFromFile(fileName: string) {

  const baseName = fileName.split("/").pop()?.replace(/\.[^.]+$/, "") || "Component";

  const safeName = baseName.replace(/[^a-zA-Z0-9]/g, " ");

  const pascalName = safeName

    .split(" ")

    .filter(Boolean)

    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))

    .join("");



  return /^[A-Z]/.test(pascalName) ? pascalName : "GeneratedComponent";

}



function createPlaceholderFile(fileName: string): FileData {

  const language = getLanguageFromFilename(fileName);

  const extension = fileName.split(".").pop()?.toLowerCase();

  let content = "";



  if (extension === "css") {

    content = `/* Waiting for ${fileName}... */`;

  } else if (extension === "json") {

    content = "{}";

  } else if (extension === "html") {

    content = "<div></div>";

  } else if (extension === "js") {

    content = "export default {};";

  } else {

    const componentName = fileName.endsWith("App.jsx")

      ? "App"

      : componentNameFromFile(fileName);



    content = `export default function ${componentName}() {

  return <div>Generating ${fileName}...</div>;

}`;

  }



  return {

    name: fileName,

    content,

    language,

  };

}


interface ResumeContext {
  resume?: boolean;
  existingFiles?: FileData[];
  manifest?: ProjectManifest;
  structure?: string[];
}

async function runContractFirstStream(
  prompt: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  options: ProviderOptions = {},
  resumeContext?: ResumeContext
) {
  let structure: string[];
  let manifest: ProjectManifest;
  let fileNames: string[];
  let generatedFiles: FileData[];
  const summaries = new Map<string, FileSummary>();
  let filesToGenerate: string[];

  if (
    resumeContext?.resume &&
    resumeContext.manifest &&
    resumeContext.existingFiles &&
    resumeContext.existingFiles.length > 0
  ) {
    manifest = resumeContext.manifest;
    structure = resumeContext.structure || manifest.files;
    controller.enqueue(streamEvent({ type: "manifest", manifest }));

    fileNames = orderedManifestFiles(manifest).filter(isCodegenFile);
    generatedFiles = [...resumeContext.existingFiles];


    for (const f of resumeContext.existingFiles) {
      if (!isPlaceholderFile(f)) {
        summaries.set(f.name, localFileSummary(f.name, f.content));
      }
    }

    filesToGenerate = fileNames.filter((name) => !summaries.has(name));
    controller.enqueue(streamEvent({ type: "structure", files: generatedFiles }));
  } else {
    structure = await AIService.generateStructure(prompt, options);
    controller.enqueue(streamEvent({ type: "structure_paths", paths: structure }));

    manifest = await AIService.generateManifest(prompt, structure, options);
    controller.enqueue(streamEvent({ type: "manifest", manifest }));

    fileNames = orderedManifestFiles(manifest).filter(isCodegenFile);
    const placeholderFiles = fileNames.map(createPlaceholderFile);
    generatedFiles = [...placeholderFiles];
    controller.enqueue(streamEvent({ type: "structure", files: placeholderFiles }));
    filesToGenerate = [...fileNames];
  }

  let stoppedEarly = false;
  let stopReason = "";

  for (let i = 0; i < filesToGenerate.length; i++) {
    const fileName = filesToGenerate[i];
    try {
      const file = await AIService.generateProjectFile(
        prompt,
        structure,
        manifest,
        fileName,
        summaries,
        [],
        options,
        generatedFiles
      );

      const fileIndex = generatedFiles.findIndex((entry) => entry.name === fileName);
      if (fileIndex >= 0) {
        generatedFiles[fileIndex] = file;
      } else {
        generatedFiles.push(file);
      }

      summaries.set(fileName, localFileSummary(fileName, file.content));

      controller.enqueue(
        streamEvent({
          type: "file",
          file,
          index: summaries.size,
          total: fileNames.length,
        })
      );

      if (i < filesToGenerate.length - 1) await sleep(GENERATION_PACE_MS);
    } catch (err: unknown) {
      console.error(`[Generation] Failed or model exhausted on ${fileName}:`, err);
      stoppedEarly = true;
      stopReason = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  if (stoppedEarly) {
    if (summaries.size > 0) {
      const safeFiles = ensureMissingImportsExist(generatedFiles);
      const appFile =
        safeFiles.find((f) => f.name.endsWith("App.jsx") && !isPlaceholderFile(f)) ||
        safeFiles.find((f) => !isPlaceholderFile(f));

      const completed = Array.from(summaries.keys());
      const remaining = fileNames.filter((f) => !summaries.has(f));

      controller.enqueue(
        streamEvent({
          type: "partial_done",
          code: appFile?.content || "",
          files: safeFiles,
          manifest,
          completedFiles: completed,
          remainingFiles: remaining,
          error: stopReason || "Generation interrupted",
        })
      );
      return;
    } else {
      controller.enqueue(
        streamEvent({
          type: "error",
          error: stopReason || "Failed to generate initial project files",
        })
      );
      return;
    }
  }

  let validation = AIService.validateGeneratedFiles(manifest, generatedFiles);
  controller.enqueue(
    streamEvent({
      type: "validation",
      metadata: validation.metadata,
      mismatches: validation.mismatches,
    })
  );

  let finalFiles = generatedFiles;

  if (validation.mismatches.length > 0) {
    const affected = getAffectedFiles(validation.mismatches);
    controller.enqueue(
      streamEvent({
        type: "fixing",
        files: affected,
        mismatches: validation.mismatches,
      })
    );

    try {
      finalFiles = await AIService.autoFixFiles(
        prompt,
        structure,
        manifest,
        generatedFiles,
        validation.mismatches,
        summaries,
        options
      );

      for (const [fileIndex, fileName] of affected.entries()) {
        const file = finalFiles.find((entry) => entry.name === fileName);
        if (!file) continue;

        controller.enqueue(
          streamEvent({
            type: "file",
            file,
            index: fileIndex + 1,
            total: affected.length,
          })
        );
      }

      validation = AIService.validateGeneratedFiles(manifest, finalFiles);
      controller.enqueue(
        streamEvent({
          type: "validation",
          metadata: validation.metadata,
          mismatches: validation.mismatches,
        })
      );
    } catch (fixErr) {
      console.warn("[Generation] Auto-fix failed, falling back to generated files:", fixErr);
      finalFiles = generatedFiles;
    }
  }

  finalFiles = ensureMissingImportsExist(finalFiles);
  const appFile =
    finalFiles.find((file) => file.name.endsWith("App.jsx")) || finalFiles[0];

  controller.enqueue(
    streamEvent({
      type: "done",
      code: appFile?.content || "",
      files: finalFiles,
      manifest,
      metadata: validation.metadata,
      mismatches: validation.mismatches,
    })
  );
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);

    const rateLimitKey = userId
      ? `generate:user:${userId}`
      : `generate:ip:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
    const rateLimitMax = userId ? 10 : 3;

    const rl = checkRateLimit(rateLimitKey, rateLimitMax, 10 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before generating again." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await request.json();
    const {
      prompt,
      resume,
      existingFiles,
      manifest: bodyManifest,
      structure: bodyStructure,
    } = body as {
      prompt?: string;
      resume?: boolean;
      existingFiles?: FileData[];
      manifest?: ProjectManifest;
      structure?: string[];
    };

    if (!prompt && (!resume || !existingFiles || existingFiles.length === 0)) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt && prompt.length > 4000) {
      return NextResponse.json(
        { error: "Prompt exceeds maximum length of 4000 characters" },
        { status: 400 }
      );
    }

    const options = resolveProviderOptions(body);

    if (request.headers.get("accept")?.includes("text/event-stream")) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await runContractFirstStream(prompt || "", controller, options, {
              resume,
              existingFiles,
              manifest: bodyManifest,
              structure: bodyStructure,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to generate code";
            controller.enqueue(streamEvent({ type: "error", error: errorMessage }));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const result = await AIService.generateCode(prompt, options);



    if (result.error) {

      return NextResponse.json({ error: result.error }, { status: 500 });

    }



    return NextResponse.json(result);

  } catch (error) {

    const errorMessage =

      error instanceof Error ? error.message : "Failed to generate code";

    return NextResponse.json({ error: errorMessage }, { status: 500 });

  }

}

