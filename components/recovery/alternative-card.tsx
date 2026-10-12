"use client";

import { ArrowRight, Check } from "lucide-react";
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

  // 1. BEST MATCH: Visibly larger card with navy 2px top border and one-line reason
  if (isBestMatch) {
    return (
      <article
        className={`bg-surface rounded-xl border border-border border-t-2 border-t-primary p-6 transition-all duration-150 relative ${
          isSelected ? "ring-2 ring-primary/20" : ""
        }`}
        aria-label={`Best match alternative: ${alternative.trainName}`}
      >
        {/* Header Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="micro-label text-primary font-semibold tracking-wider">
              BEST MATCH
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-xs text-muted-foreground">
              #{alternative.trainNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AvailabilityPopover availability={alternative.availability} />
          </div>
        </div>

        {/* Route, Times and Fares */}
        <div className="pt-4 pb-3 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <div>
            <h3 className="text-xl font-medium text-foreground">
              {alternative.trainName}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Class {alternative.travelClass} · {alternative.changes === 0 ? "Direct (0 changes)" : `1 change (${alternative.changeStations.join(", ")})`} · {formatDuration(alternative.duration)}
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="font-mono text-xl font-semibold text-foreground">
              {formatCurrency(alternative.fare)}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatFareDifference(alternative.fareDifference)} vs original
            </p>
          </div>
        </div>

        {/* Times Row with Mono Type */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3 border-y border-hairline text-xs">
          <div>
            <span className="micro-label block">DEPARTURE</span>
            <p className="font-mono text-base font-semibold text-foreground mt-0.5">
              {formatTime(alternative.departureTime)}
            </p>
            <p className="font-mono text-muted-foreground text-[11px]">
              {alternative.fromStation.code} · {alternative.fromStation.city}
            </p>
          </div>

          <div>
            <span className="micro-label block">ARRIVAL</span>
            <p className="font-mono text-base font-semibold text-foreground mt-0.5">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </p>
            <p className="font-mono text-muted-foreground text-[11px]">
              {alternative.toStation.code} · {alternative.toStation.city}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="micro-label block">BERTH ALLOCATION</span>
            <p className="text-xs font-medium text-foreground mt-1">
              {alternative.coachBerth ?? "Confirmed berth"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Auto-allocated upon confirm
            </p>
          </div>
        </div>

        {/* One-line Plain Reason */}
        {alternative.matchReason && (
          <p className="text-xs text-muted-foreground pt-3 leading-relaxed">
            <strong className="text-foreground font-medium">Why recommended: </strong>
            {alternative.matchReason}
          </p>
        )}

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onSelect(alternative.id)}
            className={`h-10 px-5 rounded-[8px] text-xs font-medium transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary ${
              isSelected
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground hover:bg-primary-hover"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2]" />
                <span>Selected</span>
              </>
            ) : (
              <span>Select this train</span>
            )}
          </button>

          {isSelected && onReview && (
            <button
              type="button"
              onClick={() => onReview(alternative.id)}
              className="h-10 px-5 rounded-[8px] border border-border bg-surface text-xs font-medium text-foreground hover:bg-background transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>Review Itinerary</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          )}
        </div>
      </article>
    );
  }

  // 2. OTHER OPTIONS: Clean horizontal rows with mono time/fare columns
  return (
    <article
      className={`border rounded-lg bg-surface interactive-row transition-all duration-150 p-4 ${
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-border"
      }`}
      aria-label={`${alternative.trainName} (${alternative.trainNumber})`}
    >
      {/* Desktop Row */}
      <div className="hidden md:flex items-center justify-between gap-4">
        {/* Train & Route */}
        <div className="w-56 shrink-0">
          <h4 className="font-medium text-sm text-foreground truncate">
            {alternative.trainName}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
            <span>#{alternative.trainNumber}</span>
            <span>•</span>
            <span>Class {alternative.travelClass}</span>
            <span>•</span>
            <span>{alternative.changes === 0 ? "Direct" : "1 change"}</span>
          </div>
        </div>

        {/* Mono Times Column */}
        <div className="w-48 shrink-0 text-left">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTime(alternative.departureTime)}
            </span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {alternative.fromStation.code} to {alternative.toStation.code} ({formatDuration(alternative.duration)})
          </p>
        </div>

        {/* Mono Fare Column */}
        <div className="w-36 shrink-0 text-left">
          <p className="font-mono text-sm font-semibold text-foreground">
            {formatCurrency(alternative.fare)}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {formatFareDifference(alternative.fareDifference)} vs orig
          </p>
        </div>

        {/* Availability Badge */}
        <div className="w-36 shrink-0 flex items-center justify-start">
          <AvailabilityPopover availability={alternative.availability} />
        </div>

        {/* Action */}
        <div className="w-28 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onSelect(alternative.id)}
            className={`h-8 px-3 rounded-[6px] text-xs font-medium transition-colors ${
              isSelected
                ? "bg-success text-white"
                : "border border-border bg-surface text-foreground hover:bg-background"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        </div>
      </div>

      {/* Mobile Stacked Card (< 768px) */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm text-foreground">
              {alternative.trainName}
            </h4>
            <span className="font-mono text-xs text-muted-foreground">
              #{alternative.trainNumber} · Class {alternative.travelClass} · {alternative.changes === 0 ? "Direct" : "1 change"}
            </span>
          </div>
          <AvailabilityPopover availability={alternative.availability} />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline text-xs">
          <div>
            <span className="micro-label block">DEPARTURE</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTime(alternative.departureTime)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground block">
              {alternative.fromStation.code}
            </span>
          </div>

          <div>
            <span className="micro-label block">ARRIVAL</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatTimeWithDay(alternative.arrivalTime, alternative.dayOffset)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground block">
              {alternative.toStation.code}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <div>
            <span className="font-mono text-sm font-semibold text-foreground">
              {formatCurrency(alternative.fare)}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground ml-1.5">
              ({formatFareDifference(alternative.fareDifference)})
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelect(alternative.id)}
            className={`h-9 px-4 rounded-[8px] text-xs font-medium ${
              isSelected
                ? "bg-success text-white"
                : "border border-border bg-surface text-foreground"
            }`}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    </article>
  );
}
