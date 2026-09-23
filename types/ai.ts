import type {
  FileMetadata,
  ProjectManifest,
  ValidationMismatch,
} from "@/types/contract";

export type ModelProvider = "nvidia" | "openrouter" | "gemini";

export interface ProviderOptions {
  provider?: ModelProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateRequest {
  prompt: string;
  provider?: ModelProvider;
  model?: string;
}

export interface GenerateResponse {
  code: string;
  files?: FileData[];
  error?: string;
  manifest?: ProjectManifest;
  metadata?: FileMetadata[];
  mismatches?: ValidationMismatch[];
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export interface RefineRequest {
  code: string;
  message: string;
  messages?: ChatMessage[];
  files?: FileData[];
  provider?: ModelProvider;
  model?: string;
}

export interface RefineResponse {
  code: string;
  files?: FileData[];
  summary?: string;
  error?: string;
}

export interface AIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface FileData {
  name: string;
  content: string;
  language?: string;
}

export type GenerateStreamEvent =
  | { type: "structure_paths"; paths: string[] }
  | { type: "manifest"; manifest: ProjectManifest }
  | { type: "structure"; files: FileData[] }
  | { type: "file"; file: FileData; index: number; total: number }
  | { type: "validation"; metadata: FileMetadata[]; mismatches: ValidationMismatch[] }
  | { type: "fixing"; files: string[]; mismatches: ValidationMismatch[] }
  | {
      type: "done";
      code: string;
      files: FileData[];
      manifest: ProjectManifest;
      metadata: FileMetadata[];
      mismatches: ValidationMismatch[];
    }
  | { type: "error"; error: string };

export type RefineStreamEvent =
  | { type: "status"; message: string }
  | { type: "targets"; files: string[] }
  | { type: "file"; file: FileData; index: number; total: number }
  | { type: "fixing"; files: string[] }
  | { type: "done"; code: string; files: FileData[]; summary: string }
  | { type: "error"; error: string };

export type { ProjectManifest, FileMetadata, ValidationMismatch } from "@/types/contract";
