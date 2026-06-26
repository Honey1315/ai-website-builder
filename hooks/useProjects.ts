"use client";

import { useState, useCallback } from "react";
import { Project, ProjectMetadata } from "@/types/project";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProject = useCallback(
    async (project: Project): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/project/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(project),
        });

        if (!response.ok) {
          throw new Error("Failed to save project");
        }

        const saved = await response.json();
        setProjects((prev) => [...prev, saved]);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getProject = useCallback(
    async (projectId: string): Promise<Project | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/project/get?id=${projectId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        return await response.json();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/project/get?id=${projectId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete project");
        }

        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { projects, saveProject, getProject, deleteProject, loading, error };
}
