// ============================================
// API Client – Fetch wrapper with JWT auth
// ============================================

const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("cai_auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("cai_auth_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("cai_auth_token");
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json;
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: unknown) =>
    apiFetch<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: "DELETE" }),
};
