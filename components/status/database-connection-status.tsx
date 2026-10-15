"use client";

import { useState, useEffect, useCallback } from "react";
import { Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAntiSpam } from "@/lib/hooks/use-anti-spam";

interface DbHealthData {
  ok: boolean;
  source: "supabase" | "fallback";
  isOffline: boolean;
  latencyMs: number;
  message: string;
  counts?: {
    stations: number;
    trains: number;
    stops: number;
    railLinks: number;
  };
}

export function DatabaseConnectionStatus() {
  const [health, setHealth] = useState<DbHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { executeProtectedAction, isLocked } = useAntiSpam({ cooldownMs: 1200 });

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health/db");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({
          ok: false,
          source: "fallback",
          isOffline: true,
          latencyMs: 0,
          message: `Database check responded with HTTP ${res.status}`,
        });
      }
    } catch (err: unknown) {
      setHealth({
        ok: false,
        source: "fallback",
        isOffline: true,
        latencyMs: 0,
        message: err instanceof Error ? err.message : "Connection failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    // Periodic check every 90 seconds
    const interval = setInterval(fetchHealth, 90_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleManualRefresh = () => {
    executeProtectedAction(() => fetchHealth());
  };

  const isSupabase = health?.source === "supabase" && !health?.isOffline;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border/60 bg-surface/80 hover:bg-muted/40 transition-all text-[11px] text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
          title="Click to view database connection status and latency diagnostics"
        >
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabase ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </div>
          <span className="font-mono font-medium">
            {health
              ? isSupabase
                ? `Supabase DB · ${health.latencyMs}ms`
                : "Offline Snapshot"
              : "Checking DB..."}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-6 bg-surface border-border text-foreground">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Database className="w-5 h-5" />
            <DialogTitle className="text-base font-semibold">
              Railway Database Health & Diagnostics
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            TravelRescue connects to Supabase PostgreSQL with verified local fallback for 100% offline uptime.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-3 text-xs">
          {/* Status Alert Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isSupabase
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}
          >
            {isSupabase ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-medium">
                {isSupabase ? "Connected to Supabase PostgreSQL" : "Serving Verified Local Snapshot"}
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {health?.message || "Running diagnostics..."}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg border border-border bg-background space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Roundtrip Latency
              </span>
              <div className="text-base font-mono font-semibold text-foreground">
                {health?.latencyMs !== undefined ? `${health.latencyMs} ms` : "—"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-background space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Active Source
              </span>
              <div className="text-base font-medium text-foreground capitalize">
                {health?.source || "—"}
              </div>
            </div>
          </div>

          {/* Record Counts if available */}
          {health?.counts && (
            <div className="p-3 rounded-lg border border-border bg-background space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                Synchronized Railway Records
              </span>
              <div className="grid grid-cols-4 gap-2 text-center pt-1 font-mono">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {health.counts.stations}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Stations</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {health.counts.trains}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Trains</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {health.counts.stops}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Stops</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {health.counts.railLinks}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Links</div>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limit Protection Notice */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Connection calls are protected with sliding-window rate limiting.</span>
          </div>

          {/* Refresh Action */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={loading || isLocked}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Pinging..." : "Refresh Status"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
