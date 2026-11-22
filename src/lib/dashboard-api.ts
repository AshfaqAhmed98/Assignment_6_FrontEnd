export const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const dashboardCacheDurationMs = 15_000;
const dashboardCacheLimit = 32;
const dashboardResponseCache = new Map<
  string,
  { expiresAt: number; payload: unknown }
>();

function dashboardCacheKey(accessToken: string, path: string) {
  return `${accessToken}\0${path}`;
}

function invalidateDashboardCache(accessToken: string) {
  const prefix = `${accessToken}\0`;
  for (const key of dashboardResponseCache.keys()) {
    if (key.startsWith(prefix)) {
      dashboardResponseCache.delete(key);
    }
  }
}

function getCachedResponse(
  payload: unknown,
  signal?: AbortSignal | null,
) {
  if (!signal) {
    return Promise.resolve(payload);
  }

  const createAbortError = () => {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    return error;
  };

  if (signal.aborted) {
    return Promise.reject(signal.reason ?? createAbortError());
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      cleanup();
      reject(signal.reason ?? createAbortError());
    };

    signal.addEventListener("abort", onAbort, { once: true });
    queueMicrotask(() => {
      if (signal.aborted) {
        onAbort();
        return;
      }
      cleanup();
      resolve(payload);
    });
  });
}

export function clearDashboardResponseCache() {
  dashboardResponseCache.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("gearrent:auth-changed", clearDashboardResponseCache);
}

export class DashboardApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}

export function getResponseMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

export async function readResponseBody(response: Response) {
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

export async function dashboardRequest(
  path: string,
  accessToken: string,
  options: RequestInit = {},
) {
  const method = options.method?.toUpperCase() ?? "GET";
  const cacheKey = dashboardCacheKey(accessToken, path);
  if (method === "GET" && !options.signal?.aborted) {
    const cachedResponse = dashboardResponseCache.get(cacheKey);
    if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
      return getCachedResponse(cachedResponse.payload, options.signal);
    }
    if (cachedResponse) {
      dashboardResponseCache.delete(cacheKey);
    }
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const payload = await readResponseBody(response);
  if (!response.ok) {
    throw new DashboardApiError(
      getResponseMessage(payload, "Could not complete the request."),
      response.status,
    );
  }

  if (method === "GET") {
    dashboardResponseCache.delete(cacheKey);
    dashboardResponseCache.set(cacheKey, {
      expiresAt: Date.now() + dashboardCacheDurationMs,
      payload,
    });
    if (dashboardResponseCache.size > dashboardCacheLimit) {
      const oldestKey = dashboardResponseCache.keys().next().value;
      if (oldestKey !== undefined) {
        dashboardResponseCache.delete(oldestKey);
      }
    }
  } else {
    invalidateDashboardCache(accessToken);
  }

  return payload;
}
