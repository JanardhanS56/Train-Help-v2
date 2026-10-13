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
  avatar?: string;
  isDemo?: boolean;
}

export interface StoredCredentials {
  email: string;
  password: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedCredentials: StoredCredentials | null;
  signIn: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, remember?: boolean) => Promise<boolean>;
  signInDemo: () => Promise<boolean>;
  signInGoogle: () => Promise<boolean>;
  signOut: () => void;
}

// ─── Storage keys ──────────────────────────────────────────────────

const AUTH_USER_KEY = "travelrescue-auth-user";
const AUTH_CREDENTIALS_KEY = "travelrescue-auth-credentials";

// ─── Helpers ───────────────────────────────────────────────────────

function loadUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const session = sessionStorage.getItem(AUTH_USER_KEY);
    if (session) return JSON.parse(session);
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser, remember: boolean = false) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    if (remember) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // ignore
  }
}

function clearUser() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // ignore
  }
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
  try {
    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch {
    // ignore
  }
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
    async (email: string, password: string, remember: boolean = false): Promise<boolean> => {
      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      if (!cleanEmail || !cleanPass) {
        return false;
      }

      // Check against stored credentials
      const creds = loadCredentials();
      if (creds && creds.email.toLowerCase() === cleanEmail.toLowerCase() && creds.password !== cleanPass) {
        return false; // Wrong password
      }

      const name = creds?.name || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const authUser: AuthUser = { name, email: cleanEmail };
      setUser(authUser);
      saveUser(authUser, remember);

      // Remember credentials for suggestions
      const newCreds: StoredCredentials = { email: cleanEmail, password: cleanPass, name };
      saveCredentials(newCreds);
      setSavedCredentials(newCreds);

      return true;
    },
    []
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, remember: boolean = false): Promise<boolean> => {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      if (!cleanName || !cleanEmail || !cleanPass) {
        return false;
      }

      const creds: StoredCredentials = { email: cleanEmail, password: cleanPass, name: cleanName };
      saveCredentials(creds);
      setSavedCredentials(creds);

      const authUser: AuthUser = { name: cleanName, email: cleanEmail };
      setUser(authUser);
      saveUser(authUser, remember);

      return true;
    },
    []
  );

  const signInDemo = useCallback(async (): Promise<boolean> => {
    const demoUser: AuthUser = {
      name: "Vikram Patel",
      email: "vikram.patel@railmail.in",
      isDemo: true,
    };
    setUser(demoUser);
    saveUser(demoUser, false);
    return true;
  }, []);

  const signInGoogle = useCallback(async (): Promise<boolean> => {
    const googleUser: AuthUser = {
      name: "Vikram Patel",
      email: "vikram.patel@gmail.com",
    };
    setUser(googleUser);
    saveUser(googleUser, false);
    return true;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    clearUser();
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
        signInDemo,
        signInGoogle,
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
