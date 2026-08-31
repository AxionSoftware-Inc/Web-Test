const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 12_000);
const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api/v1";

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined" && window.location.port === "3001") {
    return window.location.protocol + "//" + window.location.hostname + ":8001/api/v1";
  }
  return LOCAL_API_BASE_URL;
}

function isPaginatedPayload(payload: unknown): payload is { count: number; results: unknown[] } {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "count" in payload &&
      "results" in payload &&
      Array.isArray(payload.results),
  );
}

function unwrapApiPayload<T>(payload: unknown): T {
  return isPaginatedPayload(payload) ? (payload.results as T) : (payload as T);
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, retryGet = false) {
  const attempts = retryGet ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (response.status >= 500 && attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt >= attempts - 1) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Backend server is unavailable.");
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const res = await fetchWithTimeout(getApiBaseUrl() + path, { cache: "no-store" }, true);
    if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`);
    return unwrapApiPayload<T>(await res.json());
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Backend server is unavailable.");
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetchWithTimeout(getApiBaseUrl() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, `API POST ${path} failed: ${res.status}`));
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithTimeout(getApiBaseUrl() + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await apiErrorMessage(res, `API PATCH ${path} failed: ${res.status}`));
  return res.json() as Promise<T>;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(getApiBaseUrl() + path, { method: "DELETE", cache: "no-store" });
  if (!res.ok) throw new Error(await apiErrorMessage(res, `API DELETE ${path} failed: ${res.status}`));
  if (res.status === 204) return undefined as T;
  return unwrapApiPayload<T>(await res.json());
}

async function apiErrorMessage(res: Response, fallback: string) {
  try {
    const payload = await res.json();
    if (payload?.detail) return String(payload.detail);
    if (Array.isArray(payload?.skipped) && payload.skipped.length) {
      const reasons = payload.skipped
        .slice(0, 3)
        .map((item: { title?: string; test_slug?: string; reason?: string; layer?: string; code?: string }) => {
          const prefix = [item.layer, item.code].filter(Boolean).join("/");
          return `${item.title || item.test_slug || "Item"}${prefix ? ` [${prefix}]` : ""}: ${item.reason || "unknown reason"}`;
        })
        .join(" | ");
      return `${fallback}. ${reasons}`;
    }
    if (payload && typeof payload === "object") {
      return Object.entries(payload)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
        .join(" | ");
    }
  } catch {
    return fallback;
  }
  return fallback;
}
