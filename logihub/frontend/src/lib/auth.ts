// JWT persistence — stores token in localStorage under key "logihub_token"
// Server-safe: checks for window before accessing localStorage

const TOKEN_KEY = "logihub_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
