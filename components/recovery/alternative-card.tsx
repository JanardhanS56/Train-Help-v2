"use client";

import {
  Train,
  Clock,
  ArrowRight,
  Sparkles,
  Check,
  Armchair,
} from "lucide-react";
import type { RankedAlternative } from "@/lib/types";
import {
  formatTime,
  formatCurrency,
  formatFareDifference,
  formatDuration,
  formatTimeWithDay,
} from "@/lib/format";
import { AvailabilityPopover } from "@/components/recovery/availability-popover";

interface AlternativeCardProps {
  alternative: RankedAlternative;
  isSelected: boolean;
  onSelect: (altId: string) => void;
  onReview?: (altId: string) => void;
}

export function AlternativeCard({
  alternative,
  isSelected,
  onSelect,
  onReview,
}: AlternativeCardProps) {
  const isBestMatch = alternative.rank === 1;

  return (
    <article
      className={`bg-surface rounded-xl border p-5 shadow-card transition-all relative ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/[0.02]"
          : isBestMatch
          ? "border-primary/40 ring-1 ring-primary/10"
          : "border-border hover:border-muted-foreground/30"
      }`}
      aria-label={`${alternative.trainName} (${alternative.trainNumber})`}
    >
      {/* Best Match Header Pill */}
      {isBestMatch && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold w-fit mb-3 shadow-card">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Best Match</span>
        </div>
      )}

      {/* Main Train Overview Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Train name, Number, Route & Times */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center text-primary">
              <Train className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-foreground text-sm">
              {alternative.trainName}
            </span>
            <span className="text-xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border">
              #{alternative.trainNumber}
            </span>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
              Class {alternative.travelClass}
            </span>
            {alternative.changes === 0 ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                Direct
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
                1 change ({alternative.changeStations.join(", ")})
              </span>
            )}
          </div>

          {/* Times & Route Block */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatTime(alternative.departureTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                {alternative.fromStation.code} · {alternative.fromStation.city}
              </p>
            </div>

            <div className="flex flex-col items-center px-2">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDuration(alternative.duration)}
              </span>
              <div className="w-16 h-px bg-border my-1 relative">
                <div className="absolute w-1.5 h-1.5 rounded-full bg-primary -top-[2px] right-0" />
              </div>
            </div>

            <div>
              <p className="text-lg font-bold text-foreground">
                {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
              </p>
              <p className="text-xs text-muted-foreground">
                {alternative.toStation.code} · {alternative.toStation.city}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Fare & CTA */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-border gap-2">
          <div className="text-left lg:text-right">
            <p className="text-xl font-bold text-foreground">
              {formatCurrency(alternative.fare)}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {formatFareDifference(alternative.fareDifference)} vs original
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(alternative.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all touch-target flex items-center gap-1.5 shadow-card ${
                isSelected
                  ? "bg-success text-white font-bold"
                  : "bg-primary text-primary-foreground hover:bg-primary-hover"
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Selected</span>
                </>
              ) : (
                <span>Select</span>
              )}
            </button>
            {isSelected && onReview && (
              <button
                type="button"
                onClick={() => onReview(alternative.id)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover transition-colors touch-target shadow-card flex items-center gap-1.5 animate-in fade-in-50"
              >
                <span>Review Itinerary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Meta Features Bar: Availability status & Class details */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Armchair className="w-3.5 h-3.5 text-primary" />
            <span>Class {alternative.travelClass} ({alternative.coachBerth ?? "Confirmed"})</span>
          </span>

          <AvailabilityPopover availability={alternative.availability} />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5">
          {alternative.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-background border border-border text-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Plain-Language Reason Sentence for Best Match */}
      {isBestMatch && alternative.matchReason && (
        <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs text-foreground/90">
          <span className="font-semibold text-primary">Why this is recommended: </span>
          <span>{alternative.matchReason}</span>
        </div>
      )}
    </article>
  );
}
