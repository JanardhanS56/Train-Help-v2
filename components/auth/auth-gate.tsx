"use client";

import { useAuth } from "@/context/auth-context";
import { AuthScreen } from "@/components/auth/auth-screen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading skeleton while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0b1329]">
        <div className="animate-pulse flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-600/30 border border-blue-500/20" />
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-slate-700/60 mx-auto" />
            <div className="h-3 w-24 rounded bg-slate-800/60 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated — render application
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // User is not authenticated — always present the Sign In / Sign Up option
  return <AuthScreen initialTab="sign-in" />;
}

