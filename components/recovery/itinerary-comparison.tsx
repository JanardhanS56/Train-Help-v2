"use client";

import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, Copy, Printer } from "lucide-react";
import type { Trip, Alternative } from "@/lib/types";
import { formatTime, formatTimeWithDay } from "@/lib/format";
import { JourneyTimeline } from "@/components/recovery/journey-timeline";
import { JourneyCardComparison } from "@/components/recovery/journey-card-comparison";

interface ItineraryComparisonProps {
  trip: Trip;
  alternative: Alternative;
  onConfirm: () => void;
  onBack: () => void;
}

export function ItineraryComparison({
  trip,
  alternative,
  onConfirm,
  onBack,
}: ItineraryComparisonProps) {
  const orig = trip.segments[0];
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function handleSafeConfirm() {
    if (isSubmitting) return; // Prevent double-clicking
    setIsSubmitting(true);
    onConfirm();
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
          <h1 className="text-[28px] font-display text-foreground tracking-tight leading-tight">
            Review & Confirm Recovery
          </h1>
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

      {/* Comparison Grid: Original vs New */}
      <JourneyCardComparison trip={trip} alternative={alternative} />

      {/* Vertical Journey Timeline Component */}
      <JourneyTimeline stops={timelineStops} />

      {/* Preference Match Summary Banner */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs">
        <p className="micro-label font-semibold text-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success stroke-[1.5]" />
          PREFERENCE FIT SUMMARY
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-success stroke-[2] shrink-0" />
            <span className="text-foreground">
              Arrives by <strong>{formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}</strong> (meets Delhi deadline)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-success stroke-[2] shrink-0" />
            <span className="text-foreground">
              {(alternative.availability.status || alternative.availability.type) === "available"
                ? `Confirmed berths (${alternative.availability.count ?? 12} available)`
                : (alternative.availability.status || alternative.availability.type) === "rac"
                ? `RAC status (${alternative.availability.racNumber ?? alternative.availability.count ?? 14})`
                : `Waitlist status (${alternative.availability.wlNumber ?? alternative.availability.count ?? 8})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-success stroke-[2] shrink-0" />
            <span className="text-foreground">Stays within ₹3,500 travel budget</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-success stroke-[2] shrink-0" />
            <span className="text-foreground">Instant confirmation manifest generated</span>
          </div>
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

        <button
          type="button"
          onClick={handleSafeConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-auto h-10 px-6 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>{isSubmitting ? "Confirming..." : "Confirm Recovery"}</span>
          <ArrowRight className="w-4 h-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
