export const AUTH_STORAGE_KEY = "umlify.auth.user";
export const AUTH_TOKEN_KEY = "umlify.auth.token";
export const AUTH_STATE_EVENT = "umlify:auth-state-changed";

function decodeJwtPayload(token: string): { exp?: number } | null {
  const segments = token.split(".");
  if (segments.length < 2) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = window.atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export function dispatchAuthStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getValidStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearStoredSession();
    dispatchAuthStateChanged();
    return null;
  }

  return token;
}