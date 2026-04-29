// GET /auth/me → returns current admin user
// Stores / clears JWT via @/lib/auth

import { getToken, clearToken } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import type { User } from "@/types/user";

export function useAuth() {
  // TODO: use SWR or React Query to fetch /auth/me
  // Example: const { data, error } = useSWR<{ user: User }>("/auth/me", ...)

  function logout() {
    clearToken();
    window.location.href = "/login";
  }

  return { logout };
}
