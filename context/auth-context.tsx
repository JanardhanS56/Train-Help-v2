"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
}

interface StoredCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedCredentials: StoredCredentials | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

// ─── Storage keys ──────────────────────────────────────────────────

const AUTH_USER_KEY = "travelrescue-auth-user";
const AUTH_CREDENTIALS_KEY = "travelrescue-auth-credentials";

// ─── Helpers ───────────────────────────────────────────────────────

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_USER_KEY);
}

function loadCredentials(): StoredCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveCredentials(creds: StoredCredentials) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(creds));
}

// ─── Context ───────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedCredentials, setSavedCredentials] = useState<StoredCredentials | null>(null);

  // Hydrate user + saved credentials on mount
  useEffect(() => {
    queueMicrotask(() => {
      const existingUser = loadUser();
      const existingCreds = loadCredentials();
      if (existingUser) setUser(existingUser);
      if (existingCreds) setSavedCredentials(existingCreds);
      setIsLoading(false);
    });
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Simulated sign-in: check against stored credentials or accept any
      const creds = loadCredentials();
      if (creds && creds.email === email && creds.password !== password) {
        return false; // Wrong password for known account
      }

      const name = creds?.name || email.split("@")[0];
      const authUser: AuthUser = { name, email };
      setUser(authUser);
      saveUser(authUser);

      // Remember credentials for next time
      saveCredentials({ email, password, name });
      setSavedCredentials({ email, password, name });

      return true;
    },
    []
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<boolean> => {
      // Save the new account credentials
      const creds: StoredCredentials = { email, password, name };
      saveCredentials(creds);
      setSavedCredentials(creds);

      // Automatically sign the user in
      const authUser: AuthUser = { name, email };
      setUser(authUser);
      saveUser(authUser);

      return true;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    clearUser();
    // Keep saved credentials so they can be suggested on re-login
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        savedCredentials,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
