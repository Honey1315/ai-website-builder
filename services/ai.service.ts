import { callOpenRouter } from "@/lib/openrouter";

import {

  formatPrompt,

  GENERATE_STRUCTURE_PROMPT_TEMPLATE,

  GENERATE_MANIFEST_PROMPT_TEMPLATE,

  GENERATE_FILE_PROMPT_TEMPLATE,

  GENERATE_FILE_SUMMARY_PROMPT_TEMPLATE,

  GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE,

  FIX_CONTRACT_FILE_PROMPT_TEMPLATE,

  REFINE_PROMPT_TEMPLATE,

} from "@/lib/prompts";

import { extractCode, extractMultipleFiles, extractFileStructure, getLanguageFromFilename } from "@/lib/extractCode";

import { extractManifest, createFallbackManifest } from "@/lib/extractManifest";

import { extractFileSummary } from "@/lib/extractFileSummary";

import { buildMetadataMap } from "@/lib/fileMetadata";

import { createCssFileForJsx } from "@/lib/cssGenerator";

import {

  getAffectedFiles,

  validateContracts,

} from "@/lib/contractValidation";

import {

  formatContractBlock,

  formatDependenciesBlock,

  formatFilesBlock,

  formatManifestBlock,

  formatMismatchBlock,

  formatStructureBlock,

  formatSummariesBlock,

  getComponentContract,

  getDirectDependencies,

  isCodegenFile,

  isContractFile,

  orderedManifestFiles,

} from "@/lib/contractHelpers";

import { callWithRetry } from "@/lib/modelFallback";

import {

  FileData,

  GenerateResponse,

  RefineResponse,

} from "@/types/ai";

import {

  FileMetadata,

  FileSummary,

  ProjectManifest,

  ValidationMismatch,

} from "@/types/contract";



const MAX_FIX_ROUNDS = 2;



export interface ContractGenerationResult extends GenerateResponse {

  manifest?: ProjectManifest;

  metadata?: FileMetadata[];

  mismatches?: ValidationMismatch[];

}



export interface RefineContext {

  prompt?: string;

  structure?: string[];

  manifest?: ProjectManifest;

  files?: FileData[];

  code?: string;

}



export class AIService {

  static async generateStructure(prompt: string): Promise<string[]> {

    const result = await callWithRetry(async () => {

      const formattedPrompt = formatPrompt(GENERATE_STRUCTURE_PROMPT_TEMPLATE, {

        prompt,

      });



      return await callOpenRouter([

        {

          role: "user",

          content: formattedPrompt,

        },

      ]);

    });



    const structure = extractFileStructure(result);

    return structure.length > 0 ? structure : ["src/App.jsx", "src/styles.css"];

  }



  static async generateManifest(

    prompt: string,

    structure: string[]

  ): Promise<ProjectManifest> {

    const result = await callWithRetry(async () => {

      const formattedPrompt = formatPrompt(GENERATE_MANIFEST_PROMPT_TEMPLATE, {

        prompt,

        structure: formatStructureBlock(structure),

      });



      return await callOpenRouter([

        {

          role: "user",

          content: formattedPrompt,

        },

      ]);

    });


    // console.log("Generated manifest result:", result); // Log the raw result for debugging
    // console.log("Extracted manifest:", extractManifest(result)); // Log the extracted manifest for debugging

    return extractManifest(result) || createFallbackManifest(prompt, structure);

  }



  static async generateFileSummary(

    fileName: string,

    content: string

  ): Promise<FileSummary> {

    const result = await callWithRetry(async () => {

      const formattedPrompt = formatPrompt(GENERATE_FILE_SUMMARY_PROMPT_TEMPLATE, {

        content,

      });



      return await callOpenRouter([

        {

          role: "user",

          content: formattedPrompt,

        },

      ]);

    });


    // console.log(extractFileSummary(result, fileName, content))
    return extractFileSummary(result, fileName, content);

  }



  static async generateProjectFile(

    prompt: string,

    structure: string[],

    manifest: ProjectManifest,

    fileName: string,

    summaries: Map<string, FileSummary>,

    mismatches: ValidationMismatch[] = []

  ): Promise<FileData> {

    const contract = getComponentContract(manifest, fileName);

    const dependencies = getDirectDependencies(manifest, fileName);

    const useContractTemplate = isContractFile(fileName);



    const template = mismatches.length > 0

      ? FIX_CONTRACT_FILE_PROMPT_TEMPLATE

      : useContractTemplate

        ? GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE

        : GENERATE_FILE_PROMPT_TEMPLATE;



    const result = await callWithRetry(async () => {

      const variables: Record<string, string> = {

        prompt,

        structure: formatStructureBlock(structure),

        manifest: formatManifestBlock(manifest),

        fileName,

        summaries: formatSummariesBlock(summaries),

      };



      if (useContractTemplate || mismatches.length > 0) {

        variables.contract = formatContractBlock(contract);

        variables.dependencies = formatDependenciesBlock(dependencies);

      }



      if (mismatches.length > 0) {

        variables.mismatch = formatMismatchBlock(mismatches);

      }



      const formattedPrompt = formatPrompt(template, variables);



      return await callOpenRouter([

        {

          role: "user",

          content: formattedPrompt,

        },

      ]);

    });



    return {

      name: fileName,

      content: extractCode(result),

      language: getLanguageFromFilename(fileName),

    };

  }



  static validateGeneratedFiles(

    manifest: ProjectManifest,

    files: FileData[]

  ): { metadata: FileMetadata[]; mismatches: ValidationMismatch[] } {

    const metadataByFile = buildMetadataMap(files);

    const mismatches = validateContracts(manifest, metadataByFile);



    return {

      metadata: Array.from(metadataByFile.values()),

      mismatches,

    };

  }



  static async autoFixFiles(

    prompt: string,

    structure: string[],

    manifest: ProjectManifest,

    files: FileData[],

    mismatches: ValidationMismatch[],

    summaries: Map<string, FileSummary>

  ): Promise<FileData[]> {

    const affectedFiles = getAffectedFiles(mismatches);

    if (affectedFiles.length === 0) {

      return files;

    }



    const fileMap = new Map(files.map((file) => [file.name, file]));

    let currentMismatches = mismatches;



    for (let round = 0; round < MAX_FIX_ROUNDS; round++) {

      const targets = getAffectedFiles(currentMismatches);

      if (targets.length === 0) break;



      for (const fileName of targets) {

        if (!isCodegenFile(fileName)) continue;



        const fileMismatches = currentMismatches.filter(

          (mismatch) => mismatch.parentFile === fileName || mismatch.childFile === fileName

        );



        const regenerated = await AIService.generateProjectFile(

          prompt,

          structure,

          manifest,

          fileName,

          summaries,

          fileMismatches

        );



        fileMap.set(fileName, regenerated);

        summaries.set(fileName, await AIService.generateFileSummary(fileName, regenerated.content));

      }



      const updatedFiles = Array.from(fileMap.values());

      const validation = AIService.validateGeneratedFiles(manifest, updatedFiles);

      currentMismatches = validation.mismatches;



      if (currentMismatches.length === 0) {

        return updatedFiles;

      }

    }



    return Array.from(fileMap.values());

  }



  static async generateCode(prompt: string): Promise<ContractGenerationResult> {

    try {

      const structure = await AIService.generateStructure(prompt);

      const manifest = await AIService.generateManifest(prompt, structure);

      const generatedFiles: FileData[] = [];

      const summaries = new Map<string, FileSummary>();

//       console.log("Manifest:");
// console.log(manifest.files);

// console.log("Ordered:");
// console.log(orderedManifestFiles(manifest));

for (const fileName of orderedManifestFiles(manifest)) {
  // console.log("Generating:", fileName);

  const file = await AIService.generateProjectFile(
    prompt,
    structure,
    manifest,
    fileName,
    summaries
  );

  // console.log("Generated file:", file.name);
  // console.log("Length:", file.content.length);

  generatedFiles.push(file);
}

// console.log("Final generated files:");
// console.log(generatedFiles.map(f => f.name));


      let validation = AIService.validateGeneratedFiles(manifest, generatedFiles);



      let finalFiles = generatedFiles;

      if (validation.mismatches.length > 0) {

        finalFiles = await AIService.autoFixFiles(

          prompt,

          structure,

          manifest,

          generatedFiles,

          validation.mismatches,

          summaries

        );

        validation = AIService.validateGeneratedFiles(manifest, finalFiles);

      }



      const appFile =

        finalFiles.find((file) => file.name.endsWith("App.jsx")) || finalFiles[0];



      return {

        code: appFile?.content || "",

        files: finalFiles,

        manifest,

        metadata: validation.metadata,

        mismatches: validation.mismatches,

      };

    } catch (error) {

      return {

        code: "",

        error: error instanceof Error ? error.message : "Failed to generate code",

      };

    }

  }



  /** @deprecated Use generateStructure + generateManifest pipeline */

  static async generateFileStructure(prompt: string): Promise<string[]> {

    return AIService.generateStructure(prompt);

  }



  /** @deprecated Use generateProjectFile */

  static async generateFileCode(

    prompt: string,

    fileName: string,

    structure: string[]

  ): Promise<FileData> {

    const manifest = await AIService.generateManifest(prompt, structure);

    return AIService.generateProjectFile(prompt, structure, manifest, fileName, new Map());

  }



  /** @deprecated Use generateProjectFile */

  static async generateContractFile(

    prompt: string,

    manifest: ProjectManifest,

    fileName: string,

    mismatches: ValidationMismatch[] = [],

    structure: string[] = manifest.files,

    summaries: Map<string, FileSummary> = new Map()

  ): Promise<FileData> {

    return AIService.generateProjectFile(

      prompt,

      structure,

      manifest,

      fileName,

      summaries,

      mismatches

    );

  }



  static async refineCode(

    message: string,

    context: RefineContext = {}

  ): Promise<RefineResponse> {

    try {

      const files =

        context.files && context.files.length > 0

          ? context.files

          : context.code

            ? [{ name: "src/App.jsx", content: context.code, language: "javascript" }]

            : [];



      const structure = context.structure?.length

        ? context.structure

        : files.map((file) => file.name);



      const manifest =

        context.manifest ||

        createFallbackManifest(context.prompt || message, structure);



      const result = await callWithRetry(async () => {

        const formattedPrompt = formatPrompt(REFINE_PROMPT_TEMPLATE, {

          prompt: context.prompt || "Refine the current project",

          structure: formatStructureBlock(structure),

          manifest: formatManifestBlock(manifest),

          files: formatFilesBlock(files),

          message,

        });



        return await callOpenRouter([

          {

            role: "user",

            content: formattedPrompt,

          },

        ]);

      });



      const refinedCode = extractCode(result);

      const refinedFiles = extractMultipleFiles(result);

      return {
        code: refinedCode,
        files: refinedFiles.length > 0 ? refinedFiles : undefined,
      };

    } catch (error) {

      return {

        code: "",

        error: error instanceof Error ? error.message : "Failed to refine code",

      };

    }

  }

}

