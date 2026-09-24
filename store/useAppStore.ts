"use client";

import { create } from "zustand";
import { Project, ProjectMetadata } from "@/types/project";
import { FileData } from "@/types/ai";

interface AppState {
  currentCode: string;
  currentFiles: FileData[];
  setCode: (code: string) => void;
  setFiles: (files: FileData[]) => void;

  currentProject: Project | null;
  savedProjects: ProjectMetadata[];
  setCurrentProject: (project: Project | null) => void;
  addSavedProject: (project: ProjectMetadata) => void;
  removeSavedProject: (projectId: string) => void;

  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  history: string[];
  addToHistory: (code: string) => void;
  clearHistory: () => void;

  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentCode: "",
  currentFiles: [],
  setCode: (code) => set({ currentCode: code }),
  setFiles: (files) => set({ currentFiles: files }),

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

  loading: false,
  error: null,
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  history: [],
  addToHistory: (code) =>
    set((state) => ({
      history: [...state.history.slice(-19), code],
    })),
  clearHistory: () => set({ history: [] }),

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
