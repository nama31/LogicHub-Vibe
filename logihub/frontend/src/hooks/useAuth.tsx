"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import type { User } from "@/types/user";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    const fetchPromise = token
      ? apiGet<User>("/auth/me")
      : Promise.resolve(null);

    fetchPromise
      .then((data) => {
        if (!cancelled && data) setUser(data);
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
  }, []);

  async function login(credentials: LoginCredentials): Promise<void> {
    setError(null);
    const data = await apiPost<TokenResponse>("/auth/login", credentials);
    setToken(data.access_token);
    const me = await apiGet<User>("/auth/me");
    setUser(me);
  }

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext value={{ user, loading, error, setError, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
