"use client";

import { create } from "zustand";
import { Project, ProjectMetadata } from "@/types/project";
import { FileData } from "@/types/ai";

interface AppState {
  // Code state
  currentCode: string;
  currentFiles: FileData[];
  setCode: (code: string) => void;
  setFiles: (files: FileData[]) => void;

  // Project state
  currentProject: Project | null;
  savedProjects: ProjectMetadata[];
  setCurrentProject: (project: Project | null) => void;
  addSavedProject: (project: ProjectMetadata) => void;
  removeSavedProject: (projectId: string) => void;

  // UI state
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // History
  history: string[];
  addToHistory: (code: string) => void;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Code state
  currentCode: "",
  currentFiles: [],
  setCode: (code) => set({ currentCode: code }),
  setFiles: (files) => set({ currentFiles: files }),

  // Project state
  currentProject: null,
  savedProjects: [],
  setCurrentProject: (project) => set({ currentProject: project }),
  addSavedProject: (project) =>
    set((state) => ({
      savedProjects: [...state.savedProjects, project],
    })),
  removeSavedProject: (projectId) =>
    set((state) => ({
      savedProjects: state.savedProjects.filter((p) => p.id !== projectId),
    })),

  // UI state
  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // History
  history: [],
  addToHistory: (code) =>
    set((state) => ({
      history: [...state.history.slice(-19), code], // Keep last 20
    })),
  clearHistory: () => set({ history: [] }),

  // Reset
  reset: () =>
    set({
      currentCode: "",
      currentFiles: [],
      currentProject: null,
      loading: false,
      error: null,
      history: [],
    }),
}));
