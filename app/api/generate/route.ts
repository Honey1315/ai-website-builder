import { NextRequest, NextResponse } from "next/server";

import { AIService } from "@/services/ai.service";

import { getLanguageFromFilename } from "@/lib/extractCode";

import { resolveProviderOptions } from "@/lib/openrouter";

import { getAuthUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { localFileSummary } from "@/lib/extractFileSummary";

import type { ProviderOptions } from "@/types/ai";

import {

  isCodegenFile,

  orderedManifestFiles,

  ensureMissingImportsExist,

} from "@/lib/contractHelpers";

import { getAffectedFiles } from "@/lib/contractValidation";

import type { FileData } from "@/types/ai";

import type {

  FileMetadata,

  FileSummary,

  ProjectManifest,

  ValidationMismatch,

} from "@/types/contract";

// Inter-request pace delay — prevents bursting free-tier RPM limits when generating multi-file projects
const GENERATION_PACE_MS = 550;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



export type GenerateStreamEvent =

  | { type: "structure_paths"; paths: string[] }

  | { type: "manifest"; manifest: ProjectManifest }

  | { type: "structure"; files: FileData[] }

  | { type: "file"; file: FileData; index: number; total: number }

  | { type: "validation"; metadata: FileMetadata[]; mismatches: ValidationMismatch[] }

  | { type: "fixing"; files: string[]; mismatches: ValidationMismatch[] }

  | { type: "done"; code: string; files: FileData[]; manifest: ProjectManifest; metadata: FileMetadata[]; mismatches: ValidationMismatch[] }

  | { type: "error"; error: string };



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



async function runContractFirstStream(

  prompt: string,

  controller: ReadableStreamDefaultController<Uint8Array>,

  options: ProviderOptions = {}

) {

  const structure = await AIService.generateStructure(prompt, options);

  controller.enqueue(streamEvent({ type: "structure_paths", paths: structure }));

  // console.log("Generated structure:", structure); // Log the generated structure for debugging

  const manifest = await AIService.generateManifest(prompt, structure, options);

  controller.enqueue(streamEvent({ type: "manifest", manifest }));



  const fileNames = orderedManifestFiles(manifest).filter(isCodegenFile);
  console.log("fileNames", fileNames);

  const placeholderFiles = fileNames.map(createPlaceholderFile);

  const generatedFiles: FileData[] = [...placeholderFiles];

  const summaries = new Map<string, FileSummary>();

  // console.log("manifest :", manifest); // Log the manifest for debugging


  controller.enqueue(streamEvent({ type: "structure", files: placeholderFiles }));



  let index = 0;


  // console.log("Starting file generation for files:", fileNames); // Log the list of files to be generated

  for (const fileName of fileNames) {

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

    // Local regex extraction — no LLM call. Updates summaries so the NEXT file
    // in the loop receives real exported signatures (code is the ground truth).
    summaries.set(fileName, localFileSummary(fileName, file.content));

    index += 1;

    controller.enqueue(

      streamEvent({

        type: "file",

        file,

        index,

        total: fileNames.length,

      })

    );

    // console.log("Generated file:", fileName); // Log each generated file

    // Pace requests to avoid tripping OpenRouter / NVIDIA free-tier RPM limits
    if (index < fileNames.length) await sleep(GENERATION_PACE_MS);

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

    // Freemium model: guests can generate but get a tighter rate limit.
    // Authenticated users get a higher allowance.
    const rateLimitKey = userId
      ? `generate:user:${userId}`
      : `generate:ip:${request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"}`;
    const rateLimitMax = userId ? 10 : 3; // 10 for signed-in, 3 for guests

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
    const { prompt } = body as { prompt?: string };

    if (!prompt) {

      return NextResponse.json(

        { error: "Prompt is required" },

        { status: 400 }

      );

    }

    if (prompt.length > 4000) {
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

            await runContractFirstStream(prompt, controller, options);

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

