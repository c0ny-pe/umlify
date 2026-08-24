import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../services/api";
import {
  AUTH_STATE_EVENT,
  AUTH_STORAGE_KEY,
  clearStoredSession,
  dispatchAuthStateChanged,
  setStoredCsrfToken,
} from "../utils/authSession";

export type AuthUser = {
  id: number;
  username: string;
};

type AuthResponse = {
  user: AuthUser;
};

type AuthCredentials = {
  username: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  register: (credentials: AuthCredentials) => Promise<AuthUser>;
  updateProfile: (payload: { username: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const restoreLogin = useCallback(async () => {
    try {
      const { data } = await api.get<AuthResponse>("/users/me");
      setUser(data.user);
    } catch {
      clearStoredSession();
      setUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    restoreLogin();

    const handleAuthStateChanged = () => {
      const storedUser = readStoredUser();
      if (!storedUser) {
        setUser(null);
      }
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthStateChanged);
    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthStateChanged);
    };
  }, [restoreLogin]);

  const persistSession = useCallback((response: { data: AuthResponse; headers: Record<string, unknown> }) => {
    const csrfToken = response.headers["x-csrf-token"];
    if (typeof csrfToken === "string") {
      setStoredCsrfToken(csrfToken);
    }
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const response = await api.post<AuthResponse>("/users/login", credentials);
    return persistSession(response);
  }, [persistSession]);

  const register = useCallback(async (credentials: AuthCredentials) => {
    const response = await api.post<AuthResponse>("/users/register", credentials);
    return persistSession(response);
  }, [persistSession]);

  const updateProfile = useCallback(async (payload: { username: string }) => {
    const response = await api.put<AuthResponse>("/users/me", payload);
    return persistSession(response);
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      await api.post("/users/logout");
    } finally {
      clearStoredSession();
      dispatchAuthStateChanged();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    isInitializing,
    login,
    updateProfile,
    register,
    logout,
  }), [login, logout, register, updateProfile, user, isInitializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
