"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Trip, Alternative } from "@/lib/types";
import {
  formatTime,
  formatCurrency,
  formatDuration,
  formatFareDifference,
  formatTimeWithDay,
} from "@/lib/format";

interface JourneyCardComparisonProps {
  trip: Trip;
  alternative: Alternative;
}

export function JourneyCardComparison({ trip, alternative }: JourneyCardComparisonProps) {
  const orig = trip.segments[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Original (Disrupted) */}
      <div className="rounded-xl border border-disruption/30 bg-disruption/[0.04] p-5 space-y-4 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <span className="text-[11px] font-bold uppercase tracking-wider text-disruption flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Original (Cancelled)
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            #{orig.trainNumber}
          </span>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground text-sm">{orig.trainName}</p>
          <p className="text-xs text-muted-foreground">
            {orig.departureStation.city} ({orig.departureStation.code}) → {orig.arrivalStation.city} ({orig.arrivalStation.code})
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-background border border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Departure</p>
            <p className="text-sm font-bold line-through text-muted-foreground">{formatTime(orig.departureTime)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Arrival</p>
            <p className="text-sm font-bold line-through text-muted-foreground">
              {formatTimeWithDay(orig.arrivalTime, orig.dayOffset)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground pt-1">
          <div className="flex justify-between">
            <span>Original Fare:</span>
            <span className="font-medium text-foreground">{formatCurrency(alternative.originalFare)}</span>
          </div>
          <div className="flex justify-between">
            <span>Changes:</span>
            <span>Direct (0 changes)</span>
          </div>
          <div className="flex justify-between">
            <span>Class & Coach:</span>
            <span>Class {trip.travelClass} · {orig.coach ?? "B2"} ({orig.berth ?? "Berth 27"})</span>
          </div>
          <div className="text-[11px] text-disruption pt-1 border-t border-border/40">
            100% full refund of ₹{trip.fare} is processing to your original payment method.
          </div>
        </div>
      </div>

      {/* New Selected Journey */}
      <div className="rounded-xl border-2 border-primary bg-primary/[0.02] p-5 space-y-4 shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            New Journey
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            #{alternative.trainNumber}
          </span>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground text-sm">{alternative.trainName}</p>
          <p className="text-xs text-muted-foreground">
            {alternative.fromStation.city} ({alternative.fromStation.code}) → {alternative.toStation.city} ({alternative.toStation.code})
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-background border border-border">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Departure</p>
            <p className="text-sm font-bold text-foreground">{formatTime(alternative.departureTime)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Arrival</p>
            <p className="text-sm font-bold text-success">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground pt-1">
          <div className="flex justify-between items-center">
            <span>Replacement Fare:</span>
            <div className="text-right">
              <span className="font-bold text-foreground">{formatCurrency(alternative.fare)}</span>
              <span className="text-[10px] ml-1 text-muted-foreground">
                ({formatFareDifference(alternative.fareDifference)})
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Changes:</span>
            <span className="text-foreground">
              {alternative.changes === 0 ? "Direct (0 changes)" : `1 change (${alternative.changeStations.join(", ")})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Class & Coach:</span>
            <span className="text-foreground">
              Class {alternative.travelClass} ({alternative.coachBerth ?? "Confirmed"})
            </span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span className="text-foreground font-medium">{formatDuration(alternative.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
