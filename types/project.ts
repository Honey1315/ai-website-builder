import type { FileData } from "@/types/ai";

export interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  files: FileData[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  thumbnail?: string;
  isPublic?: boolean;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}
