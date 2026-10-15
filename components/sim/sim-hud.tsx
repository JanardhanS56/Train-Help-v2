"use client";

import type { SimPosition, SimScheduleStop } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import {
  Gauge,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface SimHudProps {
  position: SimPosition;
  stops: SimScheduleStop[];
  trainNumber: string;
  trainName: string;
  trainType: string;
  className?: string;
}

export function SimHud({
  position,
  stops,
  trainNumber,
  trainName,
  trainType,
  className,
}: SimHudProps) {
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const totalDistance = destination?.distanceKm || 1;
  const progressPercent = Math.min(100, Math.max(0, (position.distanceKm / totalDistance) * 100));

  const currentStop = stops[position.currentStopIndex];
  const nextStop = stops[position.nextStopIndex];

  // Delay pill formatting
  const delay = Math.round(position.delayMinutes);
  const isDelayed = delay > 0;

  // State pill styling
  const stateLabels: Record<string, { label: string; color: string; border: string }> = {
    scheduled: {
      label: "SCHEDULED",
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      border: "border-slate-300 dark:border-slate-700",
    },
    running: {
      label: "IN TRANSIT",
      color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      border: "border-emerald-300 dark:border-emerald-700",
    },
    dwelling: {
      label: "STATION HALT",
      color: "bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
      border: "border-sky-300 dark:border-sky-700",
    },
    braking: {
      label: "BRAKING / SLOWING",
      color: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      border: "border-amber-300 dark:border-amber-700",
    },
    blocked: {
      label: "OBSTACLE BLOCKED",
      color: "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      border: "border-rose-300 dark:border-rose-700 animate-pulse",
    },
    completed: {
      label: "TERMINATED",
      color: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300",
      border: "border-indigo-300 dark:border-indigo-700",
    },
  };

  const currentState = stateLabels[position.state] || stateLabels.running;

  // Format minutes of day into HH:MM (+Xd)
  const formatTime = (mins: number) => {
    const d = Math.floor(mins / 1440);
    const rem = mins % 1440;
    const h = Math.floor(rem / 60);
    const m = rem % 60;
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1E3A5F]/15 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/90 shadow-sm p-4 md:p-5 backdrop-blur-sm transition-all",
        className
      )}
      aria-label="Simulation Heads Up Display"
    >
      {/* Top Bar: Train Identity + Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E3A5F]/10 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1E3A5F] text-[#FAF7F2] dark:bg-blue-600 flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
            {trainNumber.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-[#1E3A5F]/10 dark:bg-blue-900/40 text-[#1E3A5F] dark:text-blue-300">
                #{trainNumber}
              </span>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm md:text-base leading-tight">
                {trainName}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span>{trainType}</span>
              <span>•</span>
              <span>
                {origin?.stationCode} → {destination?.stationCode} ({destination?.distanceKm} km)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delay Badge */}
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium font-mono border flex items-center gap-1.5",
              isDelayed
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
            )}
          >
            {isDelayed ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                +{delay}m DELAY
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                ON TIME
              </>
            )}
          </span>

          {/* Operational Run State */}
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 tracking-wider",
              currentState.color,
              currentState.border
            )}
          >
            {position.state === "blocked" && <AlertTriangle className="h-3 w-3 animate-bounce" />}
            {currentState.label}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4">
        {/* Metric 1: Speed Gauge */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Velocity
            </span>
            <span className="font-mono text-[10px]">max {position.maxSpeedKmph} km/h</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {Math.round(position.currentSpeedKmph)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">km/h</span>
          </div>
          {/* Mini speed bar */}
          <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                position.currentSpeedKmph > 100
                  ? "bg-blue-600"
                  : position.currentSpeedKmph > 40
                  ? "bg-teal-500"
                  : "bg-amber-500"
              )}
              style={{
                width: `${Math.min(100, (position.currentSpeedKmph / position.maxSpeedKmph) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Distance Progress */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Progress
            </span>
            <span className="font-mono text-[10px]">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {Math.round(position.distanceKm)}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              / {totalDistance} km
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1E3A5F] dark:bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Current / Last Station */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              {position.state === "dwelling" ? "Current Station" : "Departed"}
            </span>
            <span className="font-mono text-[10px]">
              Stop {position.currentStopIndex + 1}/{stops.length}
            </span>
          </div>
          <div className="mt-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
              {currentStop?.stationName || "Origin"}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Code: {currentStop?.stationCode} • {formatTime(currentStop?.departureMin ?? 0)}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Halt: {currentStop?.haltMin ?? 0}m
          </div>
        </div>

        {/* Metric 4: Next Stop & ETA */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-white/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              Next Stop
            </span>
            <span className="font-mono text-[10px]">
              {nextStop ? `${Math.max(0, nextStop.distanceKm - position.distanceKm).toFixed(0)} km` : "Terminal"}
            </span>
          </div>
          <div className="mt-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
              {nextStop?.stationName || "Journey Complete"}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ETA: {nextStop ? formatTime(nextStop.arrivalMin + Math.round(position.delayMinutes)) : "—"}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-slate-400" />
            Sched: {nextStop ? formatTime(nextStop.arrivalMin) : "—"}
          </div>
        </div>
      </div>

      {/* Dynamic Status Message banner */}
      <div className="mt-3.5 px-3.5 py-2 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          {position.statusMessage}
        </span>
        <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2">
          t = {formatTime(position.currentMinute)}
        </span>
      </div>
    </div>
  );
}
