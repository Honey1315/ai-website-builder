/**
 * Races a promise against a timeout in milliseconds.
 * If the promise does not resolve or reject before `ms`, it throws an Error with `message`.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 35000,
  message: string = `Operation timed out after ${ms}ms`
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}
