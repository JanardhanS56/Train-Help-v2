"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, HelpCircle } from "lucide-react";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error("TravelRescue Root Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full p-8 rounded-2xl border border-destructive/30 bg-card shadow-xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-destructive">
            Application Error
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Unexpected Disruption
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The application encountered an unexpected error while loading this page.
          </p>
        </div>

        {error.message && (
          <div className="p-3 rounded-lg bg-muted text-left font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-28">
            <span className="text-destructive font-semibold">Error: </span>
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto h-10 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 px-5 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-center text-[11px] text-muted-foreground">
          <Link href="/help" className="flex items-center gap-1 hover:text-foreground">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Passenger Help & FAQ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
