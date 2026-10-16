"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Check, X, ShieldCheck, Copy, Printer, Gauge, AlertCircle } from "lucide-react";
import type { Trip, Alternative, RankedAlternative } from "@/lib/types";
import { formatTime, formatTimeWithDay } from "@/lib/format";
import { JourneyTimeline } from "@/components/recovery/journey-timeline";
import { JourneyCardComparison } from "@/components/recovery/journey-card-comparison";
import { useApp } from "@/context/app-context";
import { getPreferenceFitItems } from "@/lib/matching";
import { TrainBookingDialog } from "@/components/booking/train-booking-dialog";

interface ItineraryComparisonProps {
  trip: Trip;
  alternative: Alternative;
  onConfirm: (result?: { newTrip?: Trip; refundAmount?: number; pnr?: string }) => void;
  onBack: () => void;
}

export function ItineraryComparison({
  trip,
  alternative,
  onConfirm,
  onBack,
}: ItineraryComparisonProps) {
  const { state } = useApp();
  const orig = trip.segments[0];
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rebookError, setRebookError] = useState<string | null>(null);
  const [customBookingOpen, setCustomBookingOpen] = useState(false);

  const fitItems = useMemo(
    () => getPreferenceFitItems(alternative, state.preferences, trip),
    [alternative, state.preferences, trip]
  );

  const rankedAlt = alternative as RankedAlternative;
  const scoreBreakdown = rankedAlt.score_breakdown ?? {
    time_diff_score: rankedAlt.arrivalFitScore ?? 85,
    berth_match_score: 90,
    train_type_score: rankedAlt.changesScore ?? 100,
    price_diff_score: rankedAlt.budgetFitScore ?? 80,
    overall: rankedAlt.overallScore ?? 88,
  };

  const originalFare = trip.fare || alternative.originalFare || 1450;
  const fareDiff = alternative.fare - originalFare;

  function handleCopySummary() {
    const text = [
      `TravelRescue Journey Recovery`,
      `Original: ${orig.trainName} (#${orig.trainNumber}) — Cancelled`,
      `Replacement: ${alternative.trainName} (#${alternative.trainNumber})`,
      `Route: ${alternative.fromStation.name} (${alternative.fromStation.code}) → ${alternative.toStation.name} (${alternative.toStation.code})`,
      `Departure: ${formatTime(alternative.departureTime)} | Arrival: ${formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}`,
      `Class: ${alternative.travelClass} (${alternative.coachBerth ?? "Confirmed"})`,
      `Replacement Fare: ₹${alternative.fare}`,
      `Original Fare Refund: ₹${trip.fare} (100% full refund in progress)`,
    ].join("\n");

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  async function handleSafeConfirm() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setRebookError(null);

    try {
      const res = await fetch("/api/rebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTripId: trip.id,
          alternative,
          passengerName: trip.passengerName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to complete rebooking transaction.");
      }

      const data = await res.json();
      onConfirm({
        newTrip: data.rebooking?.newAppTrip,
        refundAmount: data.rebooking?.refundAmount,
        pnr: data.rebooking?.pnr,
      });
    } catch (err: unknown) {
      console.error("Rebooking error:", err);
      setRebookError(err instanceof Error ? err.message : "Rebooking failed. Please try again.");
      setIsSubmitting(false);
    }
  }

  const timelineStops = alternative.timelineStops ?? [
    {
      station: alternative.fromStation.name,
      code: alternative.fromStation.code,
      time: formatTime(alternative.departureTime),
      platform: "Platform 1",
      type: "origin",
    },
    {
      station: "Intermediate Stop",
      code: "HALT",
      time: "Midpoint",
      platform: "Platform 2",
      type: "halt",
    },
    {
      station: alternative.toStation.name,
      code: alternative.toStation.code,
      time: formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset),
      platform: "Platform TBA",
      type: "destination",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-display text-foreground tracking-tight leading-tight">
              Review & Confirm Recovery
            </h1>
            {/* Fare Difference Badge */}
            {fareDiff < 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ₹{Math.abs(fareDiff)} Refund Due
              </span>
            ) : fareDiff > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                +₹{fareDiff} Additional Fare
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                No Fare Change
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Compare your cancelled train with your replacement journey before generating manifest.
          </p>
        </div>

        {/* Copy summary and Print itinerary buttons */}
        <div className="flex items-center gap-2 no-print self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors"
            title="Copy journey summary to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success stroke-[2]" /> : <Copy className="w-3.5 h-3.5 stroke-[1.5]" />}
            <span>{copied ? "Copied" : "Copy summary"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors"
            title="Print recovery itinerary"
          >
            <Printer className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Error Alert if Rebooking Rejection Occurred */}
      {rebookError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Rebooking Conflict</p>
            <p className="text-foreground/90">{rebookError}</p>
          </div>
        </div>
      )}

      {/* Comparison Grid: Original vs New */}
      <JourneyCardComparison trip={trip} alternative={alternative} />

      {/* Explainable Score Breakdown */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <p className="micro-label font-semibold text-foreground flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-primary stroke-[1.5]" />
            EXPLAINABLE MATCH SCORE BREAKDOWN
          </p>
          <span className="font-mono text-xs font-bold text-primary">
            {scoreBreakdown.overall}/100 Match
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-background border border-border space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Arrival Fit</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground">{scoreBreakdown.time_diff_score}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, scoreBreakdown.time_diff_score)}%` }} />
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Berth Match</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground">{scoreBreakdown.berth_match_score}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, scoreBreakdown.berth_match_score)}%` }} />
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Route & Speed</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground">{scoreBreakdown.train_type_score}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, scoreBreakdown.train_type_score)}%` }} />
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-background border border-border space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">Budget Fit</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-foreground">{scoreBreakdown.price_diff_score}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, scoreBreakdown.price_diff_score)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Journey Timeline Component */}
      <JourneyTimeline stops={timelineStops} />

      {/* Preference Match Summary Banner */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-2.5 text-xs">
        <p className="micro-label font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success stroke-[1.5]" />
          PREFERENCE FIT SUMMARY
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
          {fitItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              {item.met ? (
                <Check className="w-3.5 h-3.5 text-success stroke-[2] shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-warning stroke-[2] shrink-0" />
              )}
              <span className={item.met ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-hairline no-print">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto h-10 px-4 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors"
        >
          Choose Another Option
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCustomBookingOpen(true)}
            className="w-full sm:w-auto h-10 px-4 rounded-[8px] border border-primary/30 bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
          >
            Customize Class & Quota
          </button>

          <button
            type="button"
            onClick={handleSafeConfirm}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-10 px-6 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? "Executing Rebooking..." : "1-Click Express Confirm"}</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <TrainBookingDialog
        open={customBookingOpen}
        onOpenChange={setCustomBookingOpen}
        trainInfo={{
          trainNumber: alternative.trainNumber,
          trainName: alternative.trainName,
          fromStation: alternative.fromStation,
          toStation: alternative.toStation,
          departureTime: alternative.departureTime,
          arrivalTime: alternative.arrivalTime,
          defaultClass: alternative.travelClass,
        }}
        onBookingSuccess={() => {
          onConfirm();
        }}
      />
    </div>
  );
}
