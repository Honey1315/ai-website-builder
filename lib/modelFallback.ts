export interface RetryConfig {
  retryDelay: number;
  maxRetries: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retryDelay: 1000,
  maxRetries: 3,
};

export async function callWithRetry<T>(
  callFn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      return await callFn();
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < finalConfig.maxRetries - 1) {
        await delay(finalConfig.retryDelay * Math.pow(2, attempt));
      } else {
        throw error;
      }
    }
  }

  throw new Error("Max retries exhausted");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
