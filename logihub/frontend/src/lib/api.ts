// Base fetch client — automatically attaches JWT Bearer token to every request
// Uses NEXT_PUBLIC_API_URL as the base URL

import { getToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const apiGet  = <T>(path: string)                  => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body: unknown)   => request<T>(path, { method: "POST",   body: JSON.stringify(body) });
export const apiPatch= <T>(path: string, body: unknown)   => request<T>(path, { method: "PATCH",  body: JSON.stringify(body) });
export const apiDel  = <T>(path: string)                  => request<T>(path, { method: "DELETE" });
