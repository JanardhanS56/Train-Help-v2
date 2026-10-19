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
  ShieldCheck,
  Activity,
} from "lucide-react";

interface SimHudProps {
  position: SimPosition;
  stops: SimScheduleStop[];
  trainNumber: string;
  trainName: string;
  trainType: string;
  isOfflineFallback?: boolean;
  className?: string;
}

export function SimHud({
  position,
  stops,
  trainNumber,
  trainName,
  trainType,
  isOfflineFallback = false,
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

  // Format minutes of day into HH:MM (+Xd) without float decimals
  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const d = Math.floor(totalMins / 1440);
    const rem = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(rem / 60);
    const m = Math.floor(rem % 60);
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
      aria-live="polite"
    >
      {/* Top Bar: Train Identity + Status Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
            {trainNumber.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                #{trainNumber}
              </span>
              <h2 className="font-semibold text-foreground text-sm md:text-base leading-tight">
                {trainName}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
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
                ? "bg-disruption-tint text-disruption border-disruption/30"
                : "bg-success-tint text-success border-success/30"
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

          {/* Data Engine Resiliency Badge */}
          <span
            className={cn(
              "hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono border",
              isOfflineFallback
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-800"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800"
            )}
            title={
              isOfflineFallback
                ? "Operating in zero-network snapshot mode"
                : "Connected to Supabase live database"
            }
          >
            <ShieldCheck className="h-3 w-3" />
            {isOfflineFallback ? "Snapshot Mode" : "Live DB Sync"}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4">
        {/* Metric 1: Speed Gauge */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-surface/70 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              Velocity
            </span>
            <span className="font-mono text-[10px]">max {position.maxSpeedKmph} km/h</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {Math.round(position.currentSpeedKmph)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">km/h</span>
          </div>
          {/* Mini speed bar */}
          <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                position.currentSpeedKmph > 100
                  ? "bg-primary"
                  : position.currentSpeedKmph > 40
                  ? "bg-success"
                  : "bg-warning"
              )}
              style={{
                width: `${Math.min(100, (position.currentSpeedKmph / position.maxSpeedKmph) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Distance Progress */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-surface/70 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              Progress
            </span>
            <span className="font-mono text-[10px]">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {Math.round(position.distanceKm)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              / {totalDistance} km
            </span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Current / Last Station */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-surface/70 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-warning" />
              {position.state === "dwelling" ? "Current Station" : "Departed"}
            </span>
            <span className="font-mono text-[10px]">
              Stop {position.currentStopIndex + 1}/{stops.length}
            </span>
          </div>
          <div className="mt-1">
            <div className="font-semibold text-foreground truncate text-sm">
              {currentStop?.stationName || "Origin"}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              Code: {currentStop?.stationCode} • {formatTime(currentStop?.departureMin ?? 0)}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Halt: {currentStop?.haltMin ?? 0}m
          </div>
        </div>

        {/* Metric 4: Next Stop & ETA */}
        <div className="flex flex-col justify-between rounded-xl p-3 bg-surface/70 border border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              Next Stop
            </span>
            <span className="font-mono text-[10px]">
              {nextStop ? `${Math.max(0, nextStop.distanceKm - position.distanceKm).toFixed(0)} km` : "Terminal"}
            </span>
          </div>
          <div className="mt-1">
            <div className="font-semibold text-foreground truncate text-sm">
              {nextStop?.stationName || "Journey Complete"}
            </div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ETA: {nextStop ? formatTime(nextStop.arrivalMin + Math.round(position.delayMinutes)) : "—"}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            Sched: {nextStop ? formatTime(nextStop.arrivalMin) : "—"}
          </div>
        </div>
      </div>

      {/* Dynamic Status Message banner & Live Telemetry Coordinates */}
      <div className="mt-3.5 px-3.5 py-2 rounded-xl bg-surface/50 border border-border flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-foreground font-medium truncate flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/70 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {position.statusMessage}
        </span>

        <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground shrink-0">
          <span className="hidden md:inline">
            GPS: {position.latitude.toFixed(3)}°N, {position.longitude.toFixed(3)}°E
          </span>
          <span className="hidden sm:inline">
            Progress: {Math.round(progressPercent)}%
          </span>
          <span className="font-semibold text-foreground">
            t = {formatTime(position.currentMinute)}
          </span>
        </div>
      </div>
    </div>
  );
}
