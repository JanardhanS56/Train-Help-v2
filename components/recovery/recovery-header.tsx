"use client";

import { AlertTriangle, Clock, Receipt, CheckCircle2 } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatTimeWithDay, formatCurrency } from "@/lib/format";

interface RecoveryHeaderProps {
  trip: Trip;
  onViewBooking: () => void;
}

export function RecoveryHeader({ trip, onViewBooking }: RecoveryHeaderProps) {
  const segment = trip.segments[0];
  const refund = trip.refund;

  return (
    <section
      className="p-5 rounded-xl border border-disruption/40 bg-disruption/10 text-foreground space-y-4 shadow-card"
      aria-labelledby="recovery-disruption-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-disruption">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h1 id="recovery-disruption-title" className="text-lg font-bold">
              Your train has been cancelled
            </h1>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed max-w-2xl">
            {segment.trainName} ({segment.trainNumber}) from {segment.departureStation.city} ({segment.departureStation.code}) to {segment.arrivalStation.city} ({segment.arrivalStation.code}) was cancelled due to {trip.disruptionReason ? trip.disruptionReason.toLowerCase() : "track maintenance"}.
          </p>
          {trip.neededByTime && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                Target arrival: <strong className="text-foreground">{formatTimeWithDay(trip.neededByTime, segment.dayOffset)}</strong> in {segment.arrivalStation.city}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onViewBooking}
          className="self-start sm:self-center px-3.5 py-2 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-background transition-colors touch-target whitespace-nowrap shadow-card"
        >
          View Booking Details
        </button>
      </div>

      {/* Visual Refund Tracker Card */}
      {refund && (
        <div className="p-3.5 rounded-lg bg-surface border border-border text-xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" />
              100% Full Refund In Progress
            </span>
            <span className="font-bold text-success font-mono">
              {formatCurrency(refund.refundAmount)} (Zero deductions)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            {(["Requested", "Processing", "Refunded"] as const).map((step, idx) => {
              const isCurrent = refund.status === step;
              const isCompleted =
                (refund.status === "Refunded") ||
                (refund.status === "Processing" && idx <= 1) ||
                (refund.status === "Requested" && idx === 0);

              return (
                <div key={step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mb-1 transition-colors ${
                      isCompleted
                        ? "bg-success text-white"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-1.5 flex flex-wrap justify-between text-[11px] text-muted-foreground">
            <span>Method: {refund.refundMethod}</span>
            <span>Credited in {refund.expectedDays} business days</span>
          </div>
        </div>
      )}
    </section>
  );
}
