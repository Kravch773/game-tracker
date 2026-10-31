// The site's API through its own domain, as the browser reaches it; the session cookie lives on that domain and
// React Native keeps it in the system cookie store between launches.
export const API_URL = "https://gametracker.site/backend";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok) throw new ApiError(response.status, payload?.error ?? `HTTP ${response.status}`);
  return payload as T;
}
