import { NextRequest, NextResponse } from "next/server";

import { AIService } from "@/services/ai.service";

import { getLanguageFromFilename } from "@/lib/extractCode";

import {

  isCodegenFile,

  orderedManifestFiles,

} from "@/lib/contractHelpers";

import { getAffectedFiles } from "@/lib/contractValidation";

import type { FileData } from "@/types/ai";

import type {

  FileMetadata,

  FileSummary,

  ProjectManifest,

  ValidationMismatch,

} from "@/types/contract";



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

  controller: ReadableStreamDefaultController<Uint8Array>

) {

  const structure = await AIService.generateStructure(prompt);

  controller.enqueue(streamEvent({ type: "structure_paths", paths: structure }));



  const manifest = await AIService.generateManifest(prompt, structure);

  controller.enqueue(streamEvent({ type: "manifest", manifest }));



  const fileNames = orderedManifestFiles(manifest).filter(isCodegenFile);

  const placeholderFiles = fileNames.map(createPlaceholderFile);

  const generatedFiles: FileData[] = [...placeholderFiles];

  const summaries = new Map<string, FileSummary>();



  controller.enqueue(streamEvent({ type: "structure", files: placeholderFiles }));



  let index = 0;



  for (const fileName of fileNames) {

    const file = await AIService.generateProjectFile(

      prompt,

      structure,

      manifest,

      fileName,

      summaries

    );

    const fileIndex = generatedFiles.findIndex((entry) => entry.name === fileName);



    if (fileIndex >= 0) {

      generatedFiles[fileIndex] = file;

    } else {

      generatedFiles.push(file);

    }



    summaries.set(fileName, await AIService.generateFileSummary(fileName, file.content));



    index += 1;

    controller.enqueue(

      streamEvent({

        type: "file",

        file,

        index,

        total: fileNames.length,

      })

    );

    console.log(summaries);

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

      summaries

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

    const { prompt } = await request.json();



    if (!prompt) {

      return NextResponse.json(

        { error: "Prompt is required" },

        { status: 400 }

      );

    }



    if (request.headers.get("accept")?.includes("text/event-stream")) {

      const stream = new ReadableStream({

        async start(controller) {

          try {

            await runContractFirstStream(prompt, controller);

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



    const result = await AIService.generateCode(prompt);



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

