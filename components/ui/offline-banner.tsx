"use client";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs flex items-center justify-between backdrop-blur-md transition-all animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2 font-medium">
        <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span>You are offline. Showing cached schedules and offline data.</span>
      </div>

      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 font-semibold text-[11px] border border-amber-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        aria-label="Retry network connection"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}
