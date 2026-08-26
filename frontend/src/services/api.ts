import axios from "axios";
import {
  clearStoredSession,
  dispatchAuthStateChanged,
  getStoredCsrfToken,
} from "../utils/authSession";

// In dev the backend lives on another origin (VITE_API_TARGET, e.g. localhost:3001).
// In production the SPA and API share an origin and the app is served under a base
// path (Vite's BASE_URL, e.g. "/umlify/"), so the API is the same-origin "/umlify/api".
const explicitTarget = import.meta.env?.VITE_API_TARGET;
const basePath = String(import.meta.env?.BASE_URL ?? "/").replace(/\/+$/, "");

export const API_BASE_URL = explicitTarget
  ? String(explicitTarget).replace(/\/$/, "") + "/api"
  : `${basePath}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfToken = getStoredCsrfToken();
  if (csrfToken) {
    config.headers = config.headers ?? {};
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      clearStoredSession();
      dispatchAuthStateChanged();
    }

    return Promise.reject(error);
  }
);

export default api;
