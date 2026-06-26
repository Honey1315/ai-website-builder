import type {
  FileMetadata,
  ProjectManifest,
  ValidationMismatch,
} from "@/types/contract";

export interface GenerateRequest {
  prompt: string;
}

export interface GenerateResponse {
  code: string;
  files?: FileData[];
  error?: string;
  manifest?: ProjectManifest;
  metadata?: FileMetadata[];
  mismatches?: ValidationMismatch[];
}

export interface RefineRequest {
  code: string;
  message: string;
  files?: FileData[];
}

export interface RefineResponse {
  code: string;
  files?: FileData[];
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

export type { ProjectManifest, FileMetadata, ValidationMismatch } from "@/types/contract";
