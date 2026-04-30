import { getToken, clearToken } from "./auth";
import type { ApiError } from "@/types/api";

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

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    const error: ApiError = {
      error: "unauthorized",
      message: "Сессия истекла. Пожалуйста, войдите снова.",
    };
    throw error;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      error: "server_error",
      message: res.statusText,
    }));
    throw error as ApiError;
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export const apiGet = <T>(path: string) =>
  request<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const apiPatch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

export const apiDel = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });
