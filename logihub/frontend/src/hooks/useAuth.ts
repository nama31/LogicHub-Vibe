"use client";

import { useState, useEffect, useRef } from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import type { User } from "@/types/user";

interface LoginResponse {
  user: User;
  token: string;
}

interface MeResponse {
  user: User;
}

interface LoginCredentials {
  tg_id?: number;
  password?: string;
}

function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!getToken();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken);
  const [error, setError] = useState<string | null>(null);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current || !loading) return;
    didFetch.current = true;

    let cancelled = false;

    apiGet<MeResponse>("/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          clearToken();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading]);

  async function login(credentials: LoginCredentials): Promise<User> {
    setError(null);
    const data = await apiPost<LoginResponse>("/auth/login", credentials);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  return { user, loading, error, setError, login, logout };
}
