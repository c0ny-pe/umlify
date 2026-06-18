import axios from "axios";
import {
  clearStoredSession,
  dispatchAuthStateChanged,
  getValidStoredToken,
} from "../utils/authSession";

// In dev the backend lives on another origin (VITE_API_TARGET, e.g. localhost:3001).
// In production the SPA and API share an origin and the app is served under a base
// path (Vite's BASE_URL, e.g. "/umlify/"), so the API is the same-origin "/umlify/api".
const explicitTarget = (import.meta as any).env?.VITE_API_TARGET;
const basePath = String((import.meta as any).env?.BASE_URL ?? "/").replace(/\/+$/, "");

export const API_BASE_URL = explicitTarget
  ? String(explicitTarget).replace(/\/$/, "") + "/api"
  : `${basePath}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getValidStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
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
