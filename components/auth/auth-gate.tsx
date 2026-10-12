"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import TravelConnectSignIn from "@/components/ui/travel-connect-signin-1";
import Login05 from "@/components/ui/login-05";

type AuthView = "sign-in" | "sign-up";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, savedCredentials, signIn, signUp } = useAuth();
  const [view, setView] = useState<AuthView>("sign-in");
  const [error, setError] = useState("");

  // Show nothing while hydrating auth state from localStorage
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-200" />
          <div className="h-4 w-32 rounded bg-blue-100" />
        </div>
      </div>
    );
  }

  // User is signed in — render the app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // ── Sign In ────────────────────────────────────────────────────
  if (view === "sign-in") {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <TravelConnectSignIn
          onSignIn={async (email, password) => {
            setError("");
            const success = await signIn(email, password);
            if (!success) {
              setError("Incorrect password. Please try again.");
            }
          }}
          onSwitchToSignUp={() => {
            setError("");
            setView("sign-up");
          }}
          defaultEmail={savedCredentials?.email ?? ""}
          defaultPassword={savedCredentials?.password ?? ""}
          savedUserName={savedCredentials?.name}
          error={error}
        />
      </div>
    );
  }

  // ── Sign Up ────────────────────────────────────────────────────
  return (
    <Login05
      onSignUp={async (name, email, password) => {
        setError("");
        const success = await signUp(name, email, password);
        if (!success) {
          setError("Sign up failed. Please try again.");
        }
      }}
      onSwitchToSignIn={() => {
        setError("");
        setView("sign-in");
      }}
      error={error}
    />
  );
}
