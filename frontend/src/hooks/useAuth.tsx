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
  AUTH_TOKEN_KEY,
  clearStoredSession,
  dispatchAuthStateChanged,
  getValidStoredToken,
} from "../utils/authSession";

export type AuthUser = {
  id: number;
  username: string;
};

type AuthResponse = {
  user: AuthUser;
  token: string;
};

type AuthCredentials = {
  username: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  register: (credentials: AuthCredentials) => Promise<AuthUser>;
  updateProfile: (payload: { username: string }) => Promise<AuthUser>;
  logout: () => void;
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

function readStoredToken(): string | null {
  return getValidStoredToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [tokenPresent, setTokenPresent] = useState<boolean>(() => Boolean(readStoredToken()));

  const syncAuthFromStorage = useCallback(() => {
    const token = readStoredToken();
    const storedUser = readStoredUser();

    setTokenPresent(Boolean(token));
    setUser(token ? storedUser : null);
  }, []);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    syncAuthFromStorage();
    window.addEventListener(AUTH_STATE_EVENT, syncAuthFromStorage);

    return () => {
      window.removeEventListener(AUTH_STATE_EVENT, syncAuthFromStorage);
    };
  }, [syncAuthFromStorage]);

  const persistUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    return nextUser;
  }, []);

  const persistSession = useCallback((session: AuthResponse) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    dispatchAuthStateChanged();
    setTokenPresent(true);
    return persistUser(session.user);
  }, [persistUser]);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const { data } = await api.post<AuthResponse>("/users/login", credentials);
    return persistSession(data);
  }, [persistSession]);

  const register = useCallback(async (credentials: AuthCredentials) => {
    const { data } = await api.post<AuthResponse>("/users/register", credentials);
    return persistSession(data);
  }, [persistSession]);

  const updateProfile = useCallback(async (payload: { username: string }) => {
    const { data } = await api.put<AuthResponse>("/users/me", payload);
    return persistSession(data);
  }, [persistSession]);

  const logout = useCallback(() => {
    clearStoredSession();
    dispatchAuthStateChanged();
    setUser(null);
    setTokenPresent(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user && tokenPresent),
    login,
    updateProfile,
    register,
    logout,
  }), [login, logout, register, updateProfile, user, tokenPresent]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}