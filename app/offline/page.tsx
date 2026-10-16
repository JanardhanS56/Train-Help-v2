"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft, Train, Clock, ShieldCheck } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 space-y-6 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <WifiOff className="w-7 h-7 stroke-[1.75]" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">
            You&rsquo;re currently offline
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            TravelRescue can still access your locally cached passenger tickets, train timetables, and saved simulation runs.
          </p>
        </div>

        {/* Offline available features */}
        <div className="p-4 rounded-xl bg-neutral-tint text-left space-y-2 text-xs border border-border/50">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Available Offline</span>
          </p>
          <ul className="space-y-1.5 text-muted-foreground pt-1">
            <li className="flex items-center gap-2">
              <Train className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Cached active booking and confirmed PNR</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Saved alternative schedules and route timelines</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-full sm:w-auto h-10 px-5 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Connection</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-10 px-5 rounded-[8px] border border-border bg-surface text-foreground text-xs font-medium hover:bg-background transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Cached Trips</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
