function getResponseMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Could not issue an access token. Please try again.";
}

export class AuthAccessTokenError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthAccessTokenError";
  }
}

export async function requestAuthAccessToken(
  apiBaseUrl: string,
  signal?: AbortSignal,
) {
  const response = await fetch(`${apiBaseUrl}/api/auth/token`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The authentication server returned an invalid response.");
  }

  if (!response.ok) {
    throw new AuthAccessTokenError(
      getResponseMessage(payload),
      response.status,
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("token" in payload) ||
    typeof payload.token !== "string"
  ) {
    throw new Error("The authentication server returned an invalid token.");
  }

  return payload.token;
}
