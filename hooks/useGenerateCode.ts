"use client";

import { useState, useCallback } from "react";
import { AIService } from "@/services/ai.service";
import { GenerateResponse } from "@/types/ai";

export function useGenerateCode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (prompt: string): Promise<GenerateResponse> => {
      setLoading(true);
      setError(null);

      try {
        const result = await AIService.generateCode(prompt);

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

  return { generate, loading, error, reset };
}
