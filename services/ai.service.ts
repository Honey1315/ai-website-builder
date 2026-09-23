import { callWithRetry, callWithProviderFallback, callFastUtilityModel } from "@/lib/modelFallback";
import {
  formatPrompt,
  GENERATE_STRUCTURE_PROMPT_TEMPLATE,
  GENERATE_MANIFEST_PROMPT_TEMPLATE,
  GENERATE_FILE_PROMPT_TEMPLATE,
  GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE,
  FIX_CONTRACT_FILE_PROMPT_TEMPLATE,
  REFINE_PROMPT_TEMPLATE,
  SELECT_REFINEMENT_FILES_PROMPT_TEMPLATE,
  GENERATE_PROJECT_METADATA_PROMPT_TEMPLATE,
} from "@/lib/prompts";
import { extractCode, extractMultipleFiles, extractFileStructure, getLanguageFromFilename } from "@/lib/extractCode";
import { extractManifest, createFallbackManifest } from "@/lib/extractManifest";
import { localFileSummary } from "@/lib/extractFileSummary";
import { buildMetadataMap } from "@/lib/fileMetadata";
import { getAffectedFiles, validateContracts } from "@/lib/contractValidation";
import {
  formatContractBlock,
  formatDependenciesBlock,
  formatFilesBlock,
  formatManifestBlock,
  formatMismatchBlock,
  formatStructureBlock,
  formatSummariesBlock,
  formatSharedDataBlock,
  getComponentContract,
  getDirectDependencies,
  isCodegenFile,
  isContractFile,
  isDataOrUtilFile,
  orderedManifestFiles,
  ensureMissingImportsExist,
} from "@/lib/contractHelpers";

import { ChatMessage, FileData, GenerateResponse, ProviderOptions, RefineResponse } from "@/types/ai";
import { FileMetadata, FileSummary, ProjectManifest, ValidationMismatch } from "@/types/contract";

const MAX_FIX_ROUNDS = 2;

// Inter-request pace delay — prevents tripping free-tier RPM rate limits
// on OpenRouter / NVIDIA community pools when generating multi-file projects.
const GENERATION_PACE_MS = 550;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_PROJECT_FILES = [
  "src/App.jsx"
];

const STATIC_SYSTEM_FILES = new Set([
  "index.html",
  "vite.config.js",
  "src/main.jsx",
  "src/index.css",
  "package.json"
]);

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
  messages?: ChatMessage[];
}

function formatConversationHistory(messages?: ChatMessage[]): string {
  if (!messages || messages.length === 0) return "";
  const recent = messages.slice(-6);
  const formatted = recent
    .filter((m) => m && m.content && m.content.trim())
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.trim()}`)
    .join("\n");
  if (!formatted) return "";
  return `RECENT CONVERSATION HISTORY (Context for references like "it", "make it darker", "add reset next to pause"):\n${formatted}\n`;
}

export class AIService {
  static async generateStructure(prompt: string, options: ProviderOptions = {}): Promise<string[]> {
    const result = await callWithRetry(async () => {
      const formattedPrompt = formatPrompt(GENERATE_STRUCTURE_PROMPT_TEMPLATE, { prompt });
      return await callWithProviderFallback([
        {
          role: "system",
          content: "CRITICAL: You are an automated headless project structure generator. Output ONLY clean file paths, one per line, starting on Line 1 with 'src/App.jsx'. If the requested application warrants modular components, follow with component files under 'src/components/'. Do NOT over-engineer. ABSOLUTELY NO REASONING, NO <think> TAGS, NO SCRATCHPAD, NO EXPLANATIONS. Start immediately on Line 1.",
        },
        { role: "user", content: formattedPrompt },
      ], { ...options, temperature: 0.1 });
    });
    const structure = extractFileStructure(result);
    return structure.length > 0 ? structure : DEFAULT_PROJECT_FILES;
  }

  static async generateManifest(
    prompt: string,
    structure: string[],
    options: ProviderOptions = {}
  ): Promise<ProjectManifest> {
    const result = await callWithRetry(async () => {
      const formattedPrompt = formatPrompt(GENERATE_MANIFEST_PROMPT_TEMPLATE, {
        prompt,
        structure: formatStructureBlock(structure),
      });
      return await callWithProviderFallback([
        {
          role: "system",
          content: "CRITICAL: You are an automated headless project manifest generator. Output ONLY valid raw JSON starting on Line 1 with '{'. ABSOLUTELY NO REASONING, NO <think> TAGS, NO SCRATCHPAD, NO MARKDOWN CODE FENCES. Start immediately on Line 1.",
        },
        { role: "user", content: formattedPrompt },
      ], { ...options, temperature: 0.1 });
    });
    return extractManifest(result) || createFallbackManifest(prompt, structure);
  }

  /**
   * Extracts a FileSummary from generated file content using LOCAL regex/AST parsing.
   * Zero LLM calls, zero API cost, zero rate-limit risk. Runs in < 1ms.
   * Replaces the former LLM-based approach to cut per-project API traffic by ~50%.
   */
  static generateFileSummary(
    fileName: string,
    content: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: ProviderOptions
  ): FileSummary {
    return localFileSummary(fileName, content);
  }

  static async generateProjectFile(
    prompt: string,
    structure: string[],
    manifest: ProjectManifest,
    fileName: string,
    summaries: Map<string, FileSummary>,
    mismatches: ValidationMismatch[] = [],
    options: ProviderOptions = {},
    existingFiles: FileData[] = []
  ): Promise<FileData> {
    const contract = getComponentContract(manifest, fileName);
    const dependencies = getDirectDependencies(manifest, fileName);
    const useContractTemplate = isContractFile(fileName);

    const template = mismatches.length > 0
      ? FIX_CONTRACT_FILE_PROMPT_TEMPLATE
      : useContractTemplate
        ? GENERATE_CONTRACT_FILE_PROMPT_TEMPLATE
        : GENERATE_FILE_PROMPT_TEMPLATE;

    const sharedDataFiles = existingFiles.filter((f) => isDataOrUtilFile(f.name));

    const currentFile = existingFiles.find((f) => f.name === fileName);
    const currentContent = currentFile ? currentFile.content : "";

    const result = await callWithRetry(async () => {
      const variables: Record<string, string> = {
        prompt,
        structure: formatStructureBlock(structure),
        manifest: formatManifestBlock(manifest),
        fileName,
        summaries: formatSummariesBlock(summaries),
        sharedData: formatSharedDataBlock(sharedDataFiles),
      };

      if (useContractTemplate || mismatches.length > 0) {
        variables.contract = formatContractBlock(contract);
        variables.dependencies = formatDependenciesBlock(dependencies);
      }
      if (mismatches.length > 0) {
        variables.mismatch = formatMismatchBlock(mismatches);
        variables.currentCode = currentContent || "// Empty or ungenerated";
      }

      const formattedPrompt = formatPrompt(template, variables);
      return await callWithProviderFallback([
        {
          role: "system",
          content: `CRITICAL: You are an automated headless React code generator. Output ONLY the complete source code starting on Line 1 with '// FILE: ${fileName}'. ABSOLUTELY NO REASONING, NO CHAIN-OF-THOUGHT, NO SCRATCHPAD, NO INTERNAL MONOLOGUE (never write 'We need to...', 'Now code', etc.), NO RULE RECITATION, NO MARKDOWN CODE FENCES. Line 1 MUST be '// FILE: ${fileName}'.`,
        },
        { role: "user", content: formattedPrompt },
      ], { ...options, temperature: 0.1 });
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
    return { metadata: Array.from(metadataByFile.values()), mismatches };
  }

  static async autoFixFiles(
    prompt: string,
    structure: string[],
    manifest: ProjectManifest,
    files: FileData[],
    mismatches: ValidationMismatch[],
    summaries: Map<string, FileSummary>,
    options: ProviderOptions = {}
  ): Promise<FileData[]> {
    const affectedFiles = getAffectedFiles(mismatches);
    if (affectedFiles.length === 0) return files;

    const fileMap = new Map(files.map((file) => [file.name, file]));
    let currentMismatches = mismatches;

    for (let round = 0; round < MAX_FIX_ROUNDS; round++) {
      const targets = getAffectedFiles(currentMismatches);
      if (targets.length === 0) break;

      for (const fileName of targets) {
        if (!isCodegenFile(fileName) || STATIC_SYSTEM_FILES.has(fileName)) continue;
        const fileMismatches = currentMismatches.filter(
          (mismatch) => mismatch.parentFile === fileName || mismatch.childFile === fileName
        );
        const regenerated = await AIService.generateProjectFile(
          prompt, structure, manifest, fileName, summaries, fileMismatches, options, Array.from(fileMap.values())
        );
        fileMap.set(fileName, regenerated);
        // Local extraction — no LLM call needed
        summaries.set(fileName, AIService.generateFileSummary(fileName, regenerated.content));
        await sleep(GENERATION_PACE_MS);
      }

      const updatedFiles = Array.from(fileMap.values());
      const validation = AIService.validateGeneratedFiles(manifest, updatedFiles);
      currentMismatches = validation.mismatches;
      if (currentMismatches.length === 0) return updatedFiles;
    }
    return Array.from(fileMap.values());
  }

  static async generateCode(prompt: string, options: ProviderOptions = {}): Promise<ContractGenerationResult> {
    try {
      const structure = await AIService.generateStructure(prompt, options);
      const manifest = await AIService.generateManifest(prompt, structure, options);
      const generatedFiles: FileData[] = [];
      const summaries = new Map<string, FileSummary>();
      console.log("orderedManifestFiles", orderedManifestFiles(manifest));
      for (const fileName of orderedManifestFiles(manifest)) {
        // Skip static system foundation files - they are provided by the environment
        if (STATIC_SYSTEM_FILES.has(fileName)) continue;

        const file = await AIService.generateProjectFile(
          prompt, structure, manifest, fileName, summaries, [], options, generatedFiles
        );
        generatedFiles.push(file);
        // Update summaries with real extracted signatures immediately (code is ground truth)
        summaries.set(fileName, AIService.generateFileSummary(fileName, file.content));
        await sleep(GENERATION_PACE_MS);
      }

      let validation = AIService.validateGeneratedFiles(manifest, generatedFiles);
      let finalFiles = generatedFiles;
      if (validation.mismatches.length > 0) {
        finalFiles = await AIService.autoFixFiles(
          prompt, structure, manifest, generatedFiles, validation.mismatches, summaries, options
        );
        validation = AIService.validateGeneratedFiles(manifest, finalFiles);
      }

      finalFiles = ensureMissingImportsExist(finalFiles);
      const appFile = finalFiles.find((file) => file.name.endsWith("App.jsx")) || finalFiles[0];

      return {
        code: appFile?.content || "",
        files: finalFiles,
        manifest,
        metadata: validation.metadata,
        mismatches: validation.mismatches,
      };
    } catch (error) {
      return { code: "", error: error instanceof Error ? error.message : "Failed to generate code" };
    }
  }

  static async refineCode(
    message: string,
    context: RefineContext = {},
    options: ProviderOptions = {}
  ): Promise<RefineResponse> {
    try {
      const currentFiles = context.files && context.files.length > 0
        ? context.files
        : context.code ? [{ name: "src/App.jsx", content: context.code, language: "javascript" }] : [];

      const structure = context.structure?.length ? context.structure : currentFiles.map((file) => file.name);
      const manifest = context.manifest || createFallbackManifest(context.prompt || message, structure);

      const historyText = formatConversationHistory(context.messages);

      const selectedFiles = await AIService.selectRefinementFiles({
        message,
        prompt: context.prompt || "",
        structure,
        manifest,
        filePaths: currentFiles.map(f => f.name),
        history: historyText,
        options,
      });

      const validatedFiles = AIService.validateSelectedPaths(selectedFiles, currentFiles);
      if (validatedFiles.length === 0) {
        return { code: "", error: "No relevant files found for this refinement request." };
      }

      const expandedFiles = AIService.expandRefinementFiles({
        selectedFiles: validatedFiles,
        manifest,
        allProjectFiles: currentFiles,
      });

      const relevantFiles = currentFiles.filter(f => expandedFiles.includes(f.name));
      const refinedFiles: FileData[] = [];

      for (const targetFile of relevantFiles) {
        const result = await callWithRetry(async () => {
          const formattedPrompt = formatPrompt(REFINE_PROMPT_TEMPLATE, {
            prompt: context.prompt || "Refine the current project",
            structure: formatStructureBlock(structure),
            manifest: formatManifestBlock(manifest),
            files: formatFilesBlock(relevantFiles),
            history: historyText,
            message,
            targetFileName: targetFile.name,
          });

          return await callWithProviderFallback([
            {
              role: "system",
              content:
                "CRITICAL: You are an automated headless React code replacement engine. ABSOLUTELY NO REASONING, NO CHAIN-OF-THOUGHT, NO <think> TAGS, NO SCRATCHPAD, NO INTERNAL MONOLOGUE, NO EXPLANATIONS. Start immediately on Line 1 with '// FILE: " +
                targetFile.name +
                "' followed by the complete file content, or the exact single word 'UNCHANGED'. Any reasoning or non-code tokens will cause a fatal syntax crash.",
            },
            {
              role: "user",
              content: formattedPrompt,
            },
          ], { ...options, temperature: 0.1 });
        });

        const cleanResult = result.replace(/`/g, "").trim().toUpperCase();
        if (cleanResult === "UNCHANGED" || cleanResult === '"UNCHANGED"' || cleanResult === "'UNCHANGED'") {
          continue;
        }

        const extracted = extractMultipleFiles(result);
        if (extracted.length > 0) {
          // If extractor defaulted to App.jsx because of missing // FILE: marker, bind to targetFile.name
          for (const item of extracted) {
            if (extracted.length === 1 && item.name === "src/App.jsx" && targetFile.name !== "src/App.jsx") {
              item.name = targetFile.name;
            }
          }
          console.log("extracted: ", extracted);
          if (AIService.detectTruncatedOutput(extracted)) {
            return { code: "", error: `Refinement produced incomplete output for ${targetFile.name}.` };
          }
          refinedFiles.push(...extracted);
        }
      }

      if (refinedFiles.length === 0) {
        return { code: "", error: "Refinement did not produce any changes." };
      }

      const candidateFiles = AIService.mergeRefinedFiles(currentFiles, refinedFiles);
      const validation = AIService.validateGeneratedFiles(manifest, candidateFiles);

      let finalFiles = candidateFiles;
      if (validation.mismatches.length > 0) {
        finalFiles = await AIService.autoFixFiles(
          context.prompt || message, structure, manifest, candidateFiles, validation.mismatches, new Map(), options
        );
        const revalidation = AIService.validateGeneratedFiles(manifest, finalFiles);
        if (revalidation.mismatches.length > 0) {
          finalFiles = currentFiles;
          return { code: "", error: "Refinement produced invalid code that could not be auto-fixed." };
        }
      }

      finalFiles = ensureMissingImportsExist(finalFiles);
      const appFile = finalFiles.find((file) => file.name.endsWith("App.jsx")) || finalFiles[0];
      const modifiedFileNames = refinedFiles.map((f) => f.name.replace(/^src\//, "")).filter((v, i, a) => a.indexOf(v) === i);
      const summary = modifiedFileNames.length > 0
        ? `Updated ${modifiedFileNames.join(", ")}.`
        : "Refinement completed.";
      return { code: appFile?.content || "", files: finalFiles, summary };
    } catch (error) {
      return { code: "", error: error instanceof Error ? error.message : "Failed to refine code" };
    }
  }

  static async selectRefinementFiles(params: {
    message: string; prompt: string; structure: string[]; manifest: ProjectManifest; filePaths: string[]; history?: string; options: ProviderOptions;
  }): Promise<string[]> {
    try {
      const formattedPrompt = formatPrompt(SELECT_REFINEMENT_FILES_PROMPT_TEMPLATE, {
        prompt: params.prompt,
        structure: formatStructureBlock(params.structure),
        manifest: formatManifestBlock(params.manifest),
        filePaths: params.filePaths.join("\n"),
        history: params.history || "",
        message: params.message,
      });
      const result = await callFastUtilityModel([
        {
          role: "system",
          content:
            "CRITICAL: You are an automated headless file selector API. Output ONLY valid raw JSON starting on Line 1 with '{'. ABSOLUTELY NO REASONING, NO <think> TAGS, NO SCRATCHPAD, NO EXPLANATIONS, NO MARKDOWN CODE FENCES. Start immediately on Line 1.",
        },
        {
          role: "user",
          content: formattedPrompt,
        },
      ], { ...params.options, temperature: 0.1 });
      const jsonText = result.trim();
      const fencedMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      const jsonToParse = fencedMatch ? fencedMatch[1].trim() : jsonText;
      const parsed = JSON.parse(jsonToParse);
      return Array.isArray(parsed.files) ? parsed.files : [];
    } catch (error) {
      return [];
    }
  }

  static validateSelectedPaths(selectedFiles: string[], currentFiles: FileData[]): string[] {
    const existingPaths = new Set(currentFiles.map(f => f.name));
    return selectedFiles.filter(path => existingPaths.has(path));
  }

  static expandRefinementFiles(params: {
    selectedFiles: string[];
    manifest: ProjectManifest;
    allProjectFiles: FileData[];
  }): string[] {
    const { selectedFiles, manifest, allProjectFiles } = params;
    const existingPaths = new Set(allProjectFiles.map(f => f.name));
    const expanded = new Set<string>(selectedFiles);

    const getComponentName = (filePath: string): string | null => {
      if (filePath.endsWith("App.jsx")) return "App";
      if (!filePath.includes("/components/")) return null;
      return filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || null;
    };

    for (const filePath of selectedFiles) {
      const componentName = getComponentName(filePath);
      if (!componentName) continue;

      const childNames = manifest.dependencies[componentName] || [];
      for (const childName of childNames) {
        const childFile = manifest.components.find(c => c.name === childName)?.file;
        if (childFile && existingPaths.has(childFile)) {
          expanded.add(childFile);
        }
      }
    }
    return Array.from(expanded).sort();
  }

  static mergeRefinedFiles(currentFiles: FileData[], refinedFiles: FileData[]): FileData[] {
    const fileMap = new Map(currentFiles.map(f => [f.name, f]));
    for (const refinedFile of refinedFiles) {
      fileMap.set(refinedFile.name, refinedFile);
    }
    return Array.from(fileMap.values());
  }

  static detectTruncatedOutput(files: FileData[]): boolean {
    const lazyPatterns = [
      /(?:\/\/|\/\*)\s*\.\.\./,
      />\.\.\.</,
      /rest of (the )?code/i,
      /remaining code/i,
      /same as above/i,
      /omitted/i,
      /^\s*$/,
    ];

    for (const file of files) {
      const content = file.content.trim();
      const isCss = file.name?.endsWith('.css') || file.name?.endsWith('.scss');
      if (content.length === 0) return true;
      for (const pattern of lazyPatterns) {
        if (pattern.test(content)) return true;
      }
      const openBraces = content.split('{').length - 1;
      const closeBraces = content.split('}').length - 1;
      const openParens = content.split('(').length - 1;
      const closeParens = content.split(')').length - 1;
      const openBrackets = content.split('[').length - 1;
      const closeBrackets = content.split(']').length - 1;

      if (openBraces !== closeBraces || openParens !== closeParens || openBrackets !== closeBrackets) {
        return true;
      }
      if (isCss) {
        if (content.endsWith(":") || content.endsWith(",")) return true;
        if (content.includes("@import") && !content.includes(";")) return true;
      }
    }
    return false;
  }

  static async generateProjectMetadata(prompt: string, options: ProviderOptions = {}): Promise<{ name: string; description: string }> {
    try {
      const formattedPrompt = formatPrompt(GENERATE_PROJECT_METADATA_PROMPT_TEMPLATE, { prompt });
      const result = await callFastUtilityModel([
        {
          role: "system",
          content: "CRITICAL: You are a headless metadata generator. Return ONLY valid raw JSON starting on Line 1 with '{'. ABSOLUTELY NO REASONING, NO <think> TAGS, NO MARKDOWN CODE FENCES. Start immediately on Line 1.",
        },
        { role: "user", content: formattedPrompt },
      ], { ...options, temperature: 0.1 });
      const trimmed = result.trim();
      const fencedMatch = trimmed.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      const jsonToParse = fencedMatch ? fencedMatch[1].trim() : trimmed;
      const parsed = JSON.parse(jsonToParse);
      return {
        name: String(parsed.name || "Untitled Project").substring(0, 50),
        description: String(parsed.description || ""),
      };
    } catch (error) {
      const firstLine = prompt.split('\n').find(line => line.trim() !== '') || "Untitled Project";
      return { name: String(firstLine).substring(0, 50), description: prompt };
    }
  }
}