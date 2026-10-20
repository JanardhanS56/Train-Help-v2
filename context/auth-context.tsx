"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getBrowserSupabaseClient } from "@/lib/data/supabase-browser";

// ─── Types ─────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  isDemo?: boolean;
}

export interface StoredCredentials {
  email: string;
  password?: string;
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
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed === "object") {
      delete parsed.password;
      return parsed as StoredCredentials;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCredentials(creds: StoredCredentials) {
  if (typeof window === "undefined") return;
  try {
    const safeCreds: StoredCredentials = {
      email: creds.email,
      name: creds.name,
    };
    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(safeCreds));
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
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      queueMicrotask(() => {
        const existingUser = loadUser();
        const existingCreds = loadCredentials();
        if (existingUser) setUser(existingUser);
        if (existingCreds) setSavedCredentials(existingCreds);
        setIsLoading(false);
      });
      return;
    }

    let active = true;
    const applySession = (sessionUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!active) return;
      if (!sessionUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const name = String(sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "Passenger");
      setUser({ name, email: sessionUser.email || "" });
      setIsLoading(false);
    };

    void supabase.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, remember: boolean = false): Promise<boolean> => {
      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      if (!cleanEmail || !cleanPass) {
        return false;
      }

      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
        if (error || !data.user) return false;
        const name = String(data.user.user_metadata?.name || cleanEmail.split("@")[0]);
        const authUser: AuthUser = { name, email: cleanEmail };
        setUser(authUser);
        saveUser(authUser, remember);
        return true;
      }

      const name = savedCredentials?.name || cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const authUser: AuthUser = { name, email: cleanEmail };
      setUser(authUser);
      saveUser(authUser, remember);
      const newCreds: StoredCredentials = { email: cleanEmail, name };
      saveCredentials(newCreds);
      setSavedCredentials(newCreds);
      return true;
    },
    [savedCredentials?.name]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, remember: boolean = false): Promise<boolean> => {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      const cleanPass = password.trim();

      if (!cleanName || !cleanEmail || !cleanPass) {
        return false;
      }

      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: { name: cleanName },
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
              `${window.location.origin}/auth/callback`,
          },
        });
        if (error || !data.user) return false;
        const authUser: AuthUser = { name: cleanName, email: cleanEmail };
        setUser(authUser);
        saveUser(authUser, remember);
        return true;
      }

      const creds: StoredCredentials = { email: cleanEmail, name: cleanName };
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
    const supabase = getBrowserSupabaseClient();
    if (supabase) void supabase.auth.signOut();
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
