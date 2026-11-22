const retryableStatusCodes = new Set([502, 503, 504, 429]);

function wait(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timeout = window.setTimeout(resolve, delayMs);
    const handleAbort = () => {
      window.clearTimeout(timeout);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  attempts = 3,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const attemptController = new AbortController();
    const parentSignal = options.signal ?? undefined;
    const abortFromParent = () =>
      attemptController.abort(parentSignal?.reason);
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });

    const timeout = window.setTimeout(
      () => attemptController.abort(new DOMException("Request timed out", "TimeoutError")),
      10_000,
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: attemptController.signal,
      });
      window.clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);

      if (
        !response.ok &&
        retryableStatusCodes.has(response.status) &&
        attempt < attempts - 1
      ) {
        await wait(400 * (attempt + 1), parentSignal);
        continue;
      }

      return response;
    } catch (error) {
      window.clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
      lastError = error;

      if (
        parentSignal?.aborted ||
        (attempt < attempts - 1 &&
          !(error instanceof DOMException && error.name === "AbortError"))
      ) {
        if (!parentSignal?.aborted && attempt < attempts - 1) {
          await wait(400 * (attempt + 1), parentSignal);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Could not complete the request.");
}
