"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, Database, HelpCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime crashes for debugging
    console.error("TravelRescue App Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full p-8 rounded-2xl border border-destructive/30 bg-surface shadow-xl space-y-6 text-center">
        {/* Signal red icon */}
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-7 h-7 stroke-[1.75]" />
        </div>

        {/* Heading & description */}
        <div className="space-y-2">
          <span className="micro-label text-destructive font-mono uppercase tracking-wider">
            Signal Interruption · Error Code 500
          </span>
          <h1 className="text-2xl font-display font-medium text-foreground tracking-tight">
            We encountered a track disruption
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            The application experienced an unexpected interruption communicating with the server or rendering the railway schedule.
          </p>
        </div>

        {/* Error digest / technical info in development */}
        {error.message && (
          <div className="p-3 rounded-lg bg-background border border-border text-left font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-28">
            <span className="text-destructive font-semibold">Error: </span>
            {error.message}
            {error.digest && (
              <div className="text-[10px] text-muted-foreground/70 mt-1">
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        {/* Recovery action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto h-10 px-5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 px-5 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Reassurance footer */}
        <div className="border-t border-hairline pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>Offline verified data stays safe</span>
          </span>
          <Link href="/help" className="flex items-center gap-1 hover:text-foreground">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Passenger Help</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
