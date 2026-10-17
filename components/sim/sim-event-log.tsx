"use client";

import { cn } from "@/lib/utils";
import {
  ListFilter,
  Radio,
  Clock,
  AlertTriangle,
  CheckCircle2,
  GitFork,
  ArrowRight,
} from "lucide-react";

export interface SimEventItem {
  id: string;
  minute: number;
  type: "departure" | "arrival" | "halt" | "obstacle" | "reroute" | "info";
  title: string;
  detail: string;
}

interface SimEventLogProps {
  events: SimEventItem[];
  className?: string;
}

export function SimEventLog({ events, className }: SimEventLogProps) {
  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const d = Math.floor(totalMins / 1440);
    const rem = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(rem / 60);
    const m = Math.floor(rem % 60);
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
  };

  const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    departure: {
      icon: <ArrowRight className="h-3 w-3 text-blue-500" />,
      color: "text-blue-700 dark:text-blue-300",
    },
    arrival: {
      icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" />,
      color: "text-emerald-700 dark:text-emerald-300",
    },
    halt: {
      icon: <Clock className="h-3 w-3 text-sky-500" />,
      color: "text-sky-700 dark:text-sky-300",
    },
    obstacle: {
      icon: <AlertTriangle className="h-3 w-3 text-rose-500" />,
      color: "text-rose-700 dark:text-rose-300 font-bold",
    },
    reroute: {
      icon: <GitFork className="h-3 w-3 text-amber-500" />,
      color: "text-amber-700 dark:text-amber-300 font-semibold",
    },
    info: {
      icon: <Radio className="h-3 w-3 text-slate-400" />,
      color: "text-slate-600 dark:text-slate-400",
    },
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1E3A5F]/15 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/90 shadow-sm p-4 backdrop-blur-sm",
        className
      )}
      aria-label="Simulation Occurrence Log"
    >
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#1E3A5F]/10 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
          <h3 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
            Dispatch Telemetry & Occurrence Log
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {events.length} events logged
        </span>
      </div>

      <div
        className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono"
        aria-live="polite"
      >
        {events.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-sans text-xs">
            Simulation initialized. Real-time corridor telemetry will appear here.
          </div>
        ) : (
          events.map((ev) => {
            const cfg = typeConfig[ev.type] || typeConfig.info;
            return (
              <div key={ev.id} className="pt-2 flex items-start gap-2.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                  {formatTime(ev.minute)}
                </span>
                <div className="mt-0.5 shrink-0">{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <span className={cn("text-xs block", cfg.color)}>{ev.title}</span>
                  <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400 truncate">
                    {ev.detail}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
