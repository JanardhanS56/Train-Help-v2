"use client";

import type { Trip } from "@/lib/types";
import { formatTimeWithDay, formatDate, formatCurrency } from "@/lib/format";

interface RecoveryHeaderProps {
  trip: Trip;
  onViewBooking: () => void;
}

export function RecoveryHeader({ trip, onViewBooking }: RecoveryHeaderProps) {
  const segment = trip.segments[0];
  const refund = trip.refund;

  return (
    <section
      className="w-full bg-disruption-tint border border-disruption/30 rounded-xl p-6 text-foreground relative overflow-hidden transition-colors duration-150"
      aria-labelledby="recovery-disruption-title"
      aria-live="assertive"
    >
      {/* Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-disruption/20 text-xs">
        <div className="flex items-center gap-2">
          <span className="micro-label text-disruption font-semibold tracking-wider">
            TRAIN CANCELLED · DISRUPTION RECOVERY
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="font-mono text-muted-foreground">
            PNR {trip.pnr}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-foreground">{segment.trainName}</span>
          <span className="font-mono text-muted-foreground">#{segment.trainNumber}</span>
          <span className="font-mono font-medium text-foreground">Class {trip.travelClass}</span>
        </div>
      </div>

      {/* Route & Times */}
      <div className="pt-4 pb-2 space-y-4">
        <h1
          id="recovery-disruption-title"
          className="text-[26px] md:text-[28px] font-display text-foreground tracking-tight leading-tight"
        >
          {segment.departureStation.city} to {segment.arrivalStation.city}
        </h1>

        {/* Railway Route Line */}
        <div className="ticket-route-line my-2">
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{segment.departureStation.name}</span>
            <span>{segment.arrivalStation.name}</span>
          </div>
        </div>

        {/* Departure & Arrival separated by hairline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-hairline">
          <div>
            <span className="micro-label block">ORIGINAL DEPARTURE</span>
            <p className="font-mono text-lg font-semibold text-foreground mt-0.5">
              {formatTimeWithDay(segment.departureTime)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {segment.departureStation.code} · {formatDate(segment.departureTime)}
            </p>
          </div>

          <div>
            <span className="micro-label block">ORIGINAL ARRIVAL</span>
            <p className="font-mono text-lg font-semibold text-foreground mt-0.5">
              {formatTimeWithDay(segment.arrivalTime, segment.dayOffset)}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {segment.arrivalStation.code} · {formatDate(segment.arrivalTime)}
            </p>
          </div>

          <div>
            <span className="micro-label block">PASSENGER</span>
            <p className="text-sm font-medium text-foreground mt-1">
              {trip.passengerName}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {trip.coach ? `Coach ${trip.coach} · ${trip.berth}` : "Berth unassigned"}
            </p>
          </div>

          <div>
            <span className="micro-label block">ORIGINAL FARE</span>
            <p className="font-mono text-sm font-semibold text-disruption mt-1">
              {formatCurrency(trip.fare)} (100% Refundable)
            </p>
            <p className="text-xs text-muted-foreground">
              Direct railway refund
            </p>
          </div>
        </div>

        {/* Plain Explanation */}
        <p className="text-xs text-foreground/90 leading-relaxed pt-1">
          {segment.trainName} ({segment.trainNumber}) was cancelled due to {trip.disruptionReason ? trip.disruptionReason.toLowerCase() : "track maintenance"}.
          {trip.neededByTime && (
            <span className="text-muted-foreground ml-1">
              Your scheduled arrival deadline in {segment.arrivalStation.city} is {formatTimeWithDay(trip.neededByTime, segment.dayOffset)}.
            </span>
          )}
        </p>
      </div>

      {/* Ticket Stub Divider with Notches */}
      <div className="relative flex items-center my-4 -mx-6" aria-hidden="true">
        <div className="w-3.5 h-6 bg-background border-y border-r border-disruption/30 rounded-r-full -ml-px flex-shrink-0" />
        <div className="flex-1 border-t border-dashed border-disruption/30 mx-2" />
        <div className="w-3.5 h-6 bg-background border-y border-l border-disruption/30 rounded-l-full -mr-px flex-shrink-0" />
      </div>

      {/* Refund Block as a Quiet Row with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
        <div className="text-muted-foreground">
          {refund ? (
            <span>
              100% full refund of <strong className="text-foreground font-mono">{formatCurrency(refund.refundAmount)}</strong> is in progress to {refund.refundMethod}. Credited in {refund.expectedDays} business days.
            </span>
          ) : (
            <span>Automated IRCTC zero-fee refund initiated.</span>
          )}
        </div>

        <button
          type="button"
          onClick={onViewBooking}
          className="self-start sm:self-auto h-9 px-4 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 whitespace-nowrap"
        >
          View booking details
        </button>
      </div>
    </section>
  );
}
