const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type HealthResponse = { status: "ok" };
export type AuthenticatedIdentity = {
  id: string;
  email: string;
  session_id: string;
};
export type AccessTokenProvider = () => Promise<string | null>;

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super("ApplyGauge API request failed.");
    this.name = "ApiError";
  }
}

export async function baseApiFetch<T>(
  path: string,
  init?: RequestInit,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImplementation(`${apiBaseUrl}${path}`, init);
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function authenticatedApiFetch<T>(
  path: string,
  getAccessToken: AccessTokenProvider,
  init?: RequestInit,
  fetchImplementation: typeof fetch = fetch,
): Promise<T> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("An authenticated session is required.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  return baseApiFetch<T>(path, { ...init, headers }, fetchImplementation);
}

export function getApiHealth(signal?: AbortSignal) {
  return baseApiFetch<HealthResponse>("/api/v1/health", { signal });
}

export function getAuthenticatedIdentity(getAccessToken: AccessTokenProvider) {
  return authenticatedApiFetch<AuthenticatedIdentity>(
    "/api/v1/auth/me",
    getAccessToken,
  );
}
