"use client";

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
      {/* 1. ORIGINAL (Muted, struck-through times) */}
      <div className="rounded-xl border border-border/80 bg-surface/60 p-5 space-y-4 opacity-75">
        <div className="flex items-center justify-between pb-2.5 border-b border-hairline">
          <span className="micro-label text-disruption font-medium tracking-wider">
            ORIGINAL · CANCELLED
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            #{orig.trainNumber}
          </span>
        </div>

        <div>
          <p className="font-medium text-foreground text-sm line-through text-muted-foreground">{orig.trainName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {orig.departureStation.city} ({orig.departureStation.code}) → {orig.arrivalStation.city} ({orig.arrivalStation.code})
          </p>
        </div>

        {/* Departure & Arrival: separated by hairlines */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-hairline text-xs">
          <div>
            <span className="micro-label block">DEPARTURE</span>
            <p className="font-mono text-sm line-through text-muted-foreground mt-0.5">
              {formatTime(orig.departureTime)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{orig.departureStation.code}</p>
          </div>
          <div>
            <span className="micro-label block">ARRIVAL</span>
            <p className="font-mono text-sm line-through text-muted-foreground mt-0.5">
              {formatTimeWithDay(orig.arrivalTime, orig.dayOffset)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{orig.arrivalStation.code}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-hairline font-mono">
          <div className="flex justify-between">
            <span>Original Fare:</span>
            <span>{formatCurrency(alternative.originalFare)}</span>
          </div>
          <div className="flex justify-between">
            <span>Class:</span>
            <span>Class {trip.travelClass} ({orig.coach ?? "B2"} · {orig.berth ?? "Berth 27"})</span>
          </div>
          <div className="text-[11px] text-disruption pt-1 font-sans">
            Full refund of ₹{trip.fare} automatically in progress.
          </div>
        </div>
      </div>

      {/* 2. NEW JOURNEY (Full emphasis with ticket-stub styling) */}
      <div className="rounded-xl border border-primary/40 bg-surface p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-hairline">
          <span className="micro-label text-primary font-semibold tracking-wider">
            NEW RECOVERY JOURNEY
          </span>
          <span className="font-mono text-xs font-semibold text-foreground">
            #{alternative.trainNumber}
          </span>
        </div>

        <div>
          <h3 className="font-medium text-foreground text-base font-display">
            {alternative.trainName}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {alternative.fromStation.city} ({alternative.fromStation.code}) to {alternative.toStation.city} ({alternative.toStation.code})
          </p>
        </div>

        {/* Departure & Arrival: full emphasis mono times */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-hairline text-xs">
          <div>
            <span className="micro-label block">NEW DEPARTURE</span>
            <p className="font-mono text-base font-semibold text-foreground mt-0.5">
              {formatTime(alternative.departureTime)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{alternative.fromStation.code} · Platform 1</p>
          </div>
          <div>
            <span className="micro-label block">NEW ARRIVAL</span>
            <p className="font-mono text-base font-semibold text-success mt-0.5">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{alternative.toStation.code} · Platform TBA</p>
          </div>
        </div>

        {/* Ticket-stub divider with notch cutouts */}
        <div className="relative flex items-center my-3 -mx-5" aria-hidden="true">
          <div className="w-3 h-5 bg-background border-y border-r border-border rounded-r-full -ml-px flex-shrink-0" />
          <div className="flex-1 border-t border-dashed border-border mx-2" />
          <div className="w-3 h-5 bg-background border-y border-l border-border rounded-l-full -mr-px flex-shrink-0" />
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
          <div className="flex justify-between items-center">
            <span>Replacement Fare:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(alternative.fare)}
              <span className="font-normal text-[11px] ml-1 text-muted-foreground">
                ({formatFareDifference(alternative.fareDifference)})
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span>Class & Coach:</span>
            <span className="text-foreground">Class {alternative.travelClass} ({alternative.coachBerth ?? "Confirmed"})</span>
          </div>
          <div className="flex justify-between">
            <span>Total Duration:</span>
            <span className="text-foreground font-medium">{formatDuration(alternative.duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
