export const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

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
  return payload;
}
