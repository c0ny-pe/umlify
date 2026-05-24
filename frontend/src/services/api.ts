import axios from "axios";
import {
  clearStoredSession,
  dispatchAuthStateChanged,
  getValidStoredToken,
} from "../utils/authSession";

const apiTarget = (import.meta as any).env?.VITE_API_TARGET || "http://localhost:3001";
const base = String(apiTarget).replace(/\/$/, "") + "/api";

const api = axios.create({
  baseURL: base,
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
