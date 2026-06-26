"use client";

import { useState, useCallback } from "react";
import { AIService, RefineContext } from "@/services/ai.service";
import { RefineResponse } from "@/types/ai";

export function useRefineCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refine = useCallback(
    async (
      message: string,
      context: RefineContext = {}
    ): Promise<RefineResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await AIService.refineCode(message, context);

        if (result.error) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return { code: "", error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { refine, loading, error, reset };
}
