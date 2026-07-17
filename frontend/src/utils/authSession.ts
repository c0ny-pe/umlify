export const AUTH_STORAGE_KEY = "umlify.auth.user";
export const AUTH_CSRF_KEY = "umlify.auth.csrf";
export const AUTH_STATE_EVENT = "umlify:auth-state-changed";

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

  window.localStorage.removeItem(AUTH_CSRF_KEY);
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function setStoredCsrfToken(csrfToken: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_CSRF_KEY, csrfToken);
}

export function getStoredCsrfToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_CSRF_KEY);
}
