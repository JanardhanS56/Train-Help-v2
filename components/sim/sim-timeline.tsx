"use client";

import { useRef, useEffect } from "react";
import type { SimScheduleStop, SimPosition, Obstacle } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import { MapPin, Clock, AlertTriangle, Check, Circle } from "lucide-react";

interface SimTimelineProps {
  stops: SimScheduleStop[];
  position: SimPosition;
  activeObstacle: Obstacle | null;
  onSelectStation?: (stationCode: string) => void;
  onScrubMinute?: (minute: number) => void;
  className?: string;
}

export function SimTimeline({
  stops,
  position,
  activeObstacle,
  onSelectStation,
  onScrubMinute,
  className,
}: SimTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeStationRef = useRef<HTMLDivElement>(null);

  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const totalDistance = destination?.distanceKm || 1;

  // Auto-scroll to keep active station in view as train progresses
  useEffect(() => {
    if (activeStationRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeStationRef.current;
      const elLeft = element.offsetLeft;
      const elWidth = element.offsetWidth;
      const containerWidth = container.clientWidth;

      container.scrollTo({
        left: elLeft - containerWidth / 2 + elWidth / 2,
        behavior: "smooth",
      });
    }
  }, [position.currentStopIndex]);

  // Format time helper (clean HH:mm format without floating point decimals)
  const formatTime = (mins: number) => {
    const totalMins = Math.round(mins);
    const d = Math.floor(totalMins / 1440);
    const rem = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(rem / 60);
    const m = Math.floor(rem % 60);
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return d > 0 ? `${timeStr} (+${d}d)` : timeStr;
  };

  // Determine obstacle location matches
  const isStationObstacle = (stationCode: string) => {
    if (!activeObstacle) return false;
    return (
      activeObstacle.stationCode === stationCode ||
      activeObstacle.fromStationCode === stationCode ||
      activeObstacle.toStationCode === stationCode
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#1E3A5F]/15 dark:border-slate-800 bg-[#FAF7F2] dark:bg-slate-900/90 shadow-sm p-4 backdrop-blur-sm",
        className
      )}
      aria-label="Simulation Schedule Timeline"
    >
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#1E3A5F]/10 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#1E3A5F] dark:text-blue-400" />
          <h3 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
            Station Schedule & Corridor Progression
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {stops.length} Stops
          </span>

          {position.delayMinutes > 0 ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              +{Math.round(position.delayMinutes)}m Delay
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              On Schedule
            </span>
          )}
        </div>

        {activeObstacle && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Active Obstacle on Corridor:</span>
            <span>{activeObstacle.title}</span>
          </div>
        )}
      </div>

      {/* Horizontal Scrollable Strip */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto pb-4 pt-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        <div className="relative min-w-[700px] flex items-start justify-between px-6">
          {/* Background Connecting Rail Line */}
          <div className="absolute top-9 left-8 right-8 h-1 bg-border -z-0 rounded-full" />

          {/* Progress Completed Rail Line */}
          {origin && destination && (
            <div
              className="absolute top-9 left-8 h-1 bg-primary -z-0 rounded-full transition-all duration-300"
              style={{
                width: `calc(${Math.min(100, Math.max(0, (position.distanceKm / totalDistance) * 100))}% - 16px)`,
              }}
            />
          )}

          {/* Station Ticks */}
          {stops.map((stop, idx) => {
            const isDeparted = idx < position.currentStopIndex;
            const isCurrent = idx === position.currentStopIndex;
            const isNext = idx === position.nextStopIndex;
            const hasObstacle = isStationObstacle(stop.stationCode);
            const isDwellingHere = isCurrent && position.state === "dwelling";
            const remainingDwellMin = isDwellingHere
              ? Math.max(0, Math.round(stop.departureMin - position.currentMinute))
              : 0;

            return (
              <div
                key={stop.stationCode + stop.seq}
                ref={isCurrent ? activeStationRef : null}
                onClick={() => {
                  onSelectStation?.(stop.stationCode);
                  onScrubMinute?.(stop.arrivalMin);
                }}
                className={cn(
                  "relative z-10 flex flex-col items-center cursor-pointer group transition-all px-2 text-center",
                  "hover:scale-105 active:scale-95"
                )}
                style={{ minWidth: "90px" }}
              >
                {/* Distance Chip */}
                <span className="text-[10px] font-mono text-muted-foreground mb-2 whitespace-nowrap">
                  {Math.round(stop.distanceKm)} km
                </span>

                {/* Node Indicator Dot */}
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all shadow-xs",
                    hasObstacle
                      ? "bg-destructive border-destructive text-white animate-bounce"
                      : isCurrent
                      ? "bg-primary border-primary-hover text-primary-foreground ring-4 ring-primary/30 scale-110"
                      : isDeparted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isNext
                      ? "bg-surface border-success text-success ring-2 ring-success/20"
                      : "bg-surface border-border text-muted-foreground"
                  )}
                >
                  {hasObstacle ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : isDeparted ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <MapPin className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-2 w-2 fill-current" />
                  )}
                </div>

                {/* Station Code & Name */}
                <div className="mt-2.5">
                  <span
                    className={cn(
                      "font-mono font-bold text-xs block",
                      isCurrent
                        ? "text-[#1E3A5F] dark:text-blue-300 font-extrabold"
                        : isDeparted
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {stop.stationCode}
                  </span>
                  <span
                    className="text-[11px] text-slate-600 dark:text-slate-400 max-w-[85px] truncate block leading-tight mt-0.5"
                    title={stop.stationName}
                  >
                    {stop.stationName}
                  </span>
                </div>

                {/* Scheduled Times & Halt */}
                <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5 whitespace-nowrap">
                  <div>
                    {idx === 0 ? "Dep " : "Arr "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatTime(idx === 0 ? stop.departureMin : stop.arrivalMin)}
                    </span>
                  </div>

                  {isDwellingHere ? (
                    <span className="inline-block px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold text-[9px] animate-pulse">
                      Halt: {remainingDwellMin}m left
                    </span>
                  ) : stop.haltMin > 0 ? (
                    <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[9px]">
                      Halt {Math.round(stop.haltMin)}m
                    </span>
                  ) : null}

                  {/* Delay projection for upcoming stops */}
                  {!isDeparted && position.delayMinutes > 0 && (
                    <div className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                      Exp: {formatTime((idx === 0 ? stop.departureMin : stop.arrivalMin) + position.delayMinutes)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
