"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import type {
  Alternative,
  Trip,
  UserPreferences,
} from "@/lib/types";
import { MatchingResult } from "@/lib/matching";
import { formatCurrency, formatTime, formatTimeWithDay } from "@/lib/format";
import { DEFAULT_PREFERENCES } from "@/lib/constants";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "cn";

interface ResultsPanelProps {
  evaluation: MatchingResult;
  allAlternatives: Alternative[];
  preferences: UserPreferences;
  activeTrip: Trip | null;
  saveStatus: "saving" | "saved" | "error";
  onApplyPatch: (patch: Partial<UserPreferences>) => void;
  onResetField: <K extends keyof UserPreferences>(key: K, defaultValue: UserPreferences[K]) => void;
}

export function ResultsPanel({
  evaluation,
  allAlternatives,
  preferences,
  activeTrip,
  saveStatus,
  onApplyPatch,
  onResetField,
}: ResultsPanelProps) {
  const { eligible, ranked, cantVerifyCount, suggestions } = evaluation;
  const matchCount = eligible.length;
  const bestMatch = ranked[0] ?? null;

  // Track changed numbers for brief highlight (disabled under reduced motion)
  const [highlightCount, setHighlightCount] = useState(false);
  const prevCountRef = useRef(matchCount);

  // Debounced live announcement
  const [liveAnnouncement, setLiveAnnouncement] = useState(`${matchCount} trains match`);
  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevCountRef.current !== matchCount) {
      setHighlightCount(true);
      const t1 = setTimeout(() => setHighlightCount(false), 800);

      if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
      liveTimerRef.current = setTimeout(() => {
        setLiveAnnouncement(
          matchCount === 1 ? "1 train matches" : `${matchCount} trains match`
        );
      }, 300);

      prevCountRef.current = matchCount;
      return () => clearTimeout(t1);
    }
  }, [matchCount]);

  // Compute active preference chips (only those differing from defaults)
  const activeChips = [];

  if (preferences.maxBudget !== DEFAULT_PREFERENCES.maxBudget) {
    activeChips.push({
      id: "maxBudget",
      label: `Budget: ${formatCurrency(preferences.maxBudget)}`,
      onRemove: () => onResetField("maxBudget", DEFAULT_PREFERENCES.maxBudget),
    });
  }

  const defaultClasses = DEFAULT_PREFERENCES.classes.join(",");
  const currentClasses = preferences.classes.join(",");
  if (defaultClasses !== currentClasses) {
    activeChips.push({
      id: "classes",
      label: `Classes: ${preferences.classes.join(", ")}`,
      onRemove: () => onResetField("classes", DEFAULT_PREFERENCES.classes),
    });
  }

  if (preferences.onlyTheseClasses) {
    activeChips.push({
      id: "onlyTheseClasses",
      label: "Strict classes only",
      onRemove: () => onResetField("onlyTheseClasses", false),
    });
  }

  if (preferences.seatPreference !== DEFAULT_PREFERENCES.seatPreference) {
    activeChips.push({
      id: "seatPreference",
      label:
        preferences.seatPreference === "confirmed-only"
          ? "Confirmed only"
          : preferences.seatPreference === "any"
          ? "Any seats (incl. waitlist)"
          : "Confirmed or RAC",
      onRemove: () => onResetField("seatPreference", DEFAULT_PREFERENCES.seatPreference),
    });
  }

  if (preferences.maxChanges !== DEFAULT_PREFERENCES.maxChanges) {
    activeChips.push({
      id: "maxChanges",
      label:
        preferences.maxChanges === 0
          ? "Direct only"
          : `Up to ${preferences.maxChanges} changes`,
      onRemove: () => onResetField("maxChanges", DEFAULT_PREFERENCES.maxChanges),
    });
  }

  if (preferences.departureWindow !== DEFAULT_PREFERENCES.departureWindow) {
    activeChips.push({
      id: "departureWindow",
      label: `Departure: ${preferences.departureWindow.replace("-", " ")}`,
      onRemove: () => onResetField("departureWindow", DEFAULT_PREFERENCES.departureWindow),
    });
  }

  if (preferences.deadlineDay !== "none") {
    activeChips.push({
      id: "deadline",
      label: `Arrive by ${preferences.deadlineTime} (${preferences.deadlineDay.replace("-", " ")})`,
      onRemove: () => {
        onResetField("deadlineDay", "none");
      },
    });
  }

  if (preferences.includeNearbyStations) {
    activeChips.push({
      id: "nearby",
      label: "Nearby stations included",
      onRemove: () => onResetField("includeNearbyStations", false),
    });
  }

  if (preferences.berthPreference !== "no-preference") {
    activeChips.push({
      id: "berth",
      label: `Berth: ${preferences.berthPreference.replace("-", " ")}`,
      onRemove: () => onResetField("berthPreference", "no-preference"),
    });
  }

  if (preferences.priorityProfile !== DEFAULT_PREFERENCES.priorityProfile) {
    activeChips.push({
      id: "priority",
      label: `Priority: ${preferences.priorityProfile.replace("-", " ")}`,
      onRemove: () => onResetField("priorityProfile", DEFAULT_PREFERENCES.priorityProfile),
    });
  }

  // Inner Results Content Component for both desktop panel and mobile sheet
  const ResultsContent = (
    <div className="space-y-4 text-foreground">
      {/* Hidden Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Header & Save Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          Your Recovery Matches
        </h3>
        <div className="flex items-center gap-1.5 text-[11px]">
          {saveStatus === "saving" && (
            <span className="text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-success font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5 stroke-[2]" />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-disruption font-medium flex items-center gap-1" role="alert">
              <AlertTriangle className="w-3.5 h-3.5" />
              Save error
            </span>
          )}
        </div>
      </div>

      {/* No Active Trip Case */}
      {!activeTrip && (
        <div className="p-4 rounded-xl border border-border bg-muted/40 text-xs space-y-3">
          <p className="text-foreground leading-relaxed">
            No trip needs recovery right now. Your preferences are saved and will apply next time.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full h-9 rounded-[8px] border border-border bg-surface text-foreground font-medium hover:bg-background transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      )}

      {/* Active Trip Context Display */}
      {activeTrip && (
        <>
          {/* Match Count Banner */}
          <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Eligible Trains</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-2xl font-mono font-bold tracking-tight transition-colors duration-300 motion-reduce:transition-none",
                    highlightCount ? "text-primary" : "text-foreground"
                  )}
                >
                  {matchCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  of {allAlternatives.length} verified trains
                </span>
              </div>
            </div>

            {cantVerifyCount > 0 && (
              <span
                className="text-[11px] text-muted-foreground px-2 py-1 rounded bg-muted border border-border/60"
                title="Trains with missing schedule information excluded from verification"
              >
                {cantVerifyCount} Can&apos;t verify
              </span>
            )}
          </div>

          {/* Zero Results State with Single Relaxation Suggestion */}
          {matchCount === 0 && (
            <div className="p-4 rounded-xl border border-disruption/20 bg-disruption-tint text-xs space-y-3">
              <div className="flex items-start gap-2 text-disruption">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">No trains match these choices</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    Every verified train is currently restricted by one or more selected preferences.
                  </p>
                </div>
              </div>

              {suggestions ? (
                <div className="p-3 rounded-lg bg-surface border border-border space-y-2 mt-2">
                  <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{suggestions.message}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onApplyPatch(suggestions.patch)}
                    className="w-full h-8 px-3 rounded-[6px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
                  >
                    {suggestions.applyText}
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Try loosening your budget or allowing connecting train transfers.
                </p>
              )}
            </div>
          )}

          {/* Current Best Match Card */}
          {bestMatch && (
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="micro-label font-semibold text-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  CURRENT BEST MATCH
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {formatCurrency(bestMatch.fare)}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {bestMatch.trainName}{" "}
                  <span className="font-mono text-muted-foreground font-normal">
                    (#{bestMatch.trainNumber})
                  </span>
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
                  <span>{formatTime(bestMatch.departureTime)}</span>
                  <span>→</span>
                  <span>
                    {formatTimeWithDay(bestMatch.arrivalTime, bestMatch.dayOffset)}
                  </span>
                  <span>·</span>
                  <span className="font-sans font-semibold text-foreground">
                    {bestMatch.travelClass}
                  </span>
                </div>
              </div>

              {bestMatch.matchReason && (
                <p className="text-[11px] text-muted-foreground bg-neutral-tint p-2 rounded-md border border-border/60 leading-relaxed">
                  {bestMatch.matchReason}
                </p>
              )}
            </div>
          )}

          {/* Active Preference Chips with Individual Reset */}
          {activeChips.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="micro-label text-muted-foreground">ACTIVE CRITERIA</span>
                <span className="text-[10px] text-muted-foreground">Click × to reset</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeChips.map((chip) => (
                  <span
                    key={chip.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[11px] bg-surface border border-border text-foreground font-medium"
                  >
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={`Remove filter: ${chip.label}`}
                      className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2">
            <Link
              href={`/recovery/${activeTrip.id}`}
              className={cn(
                "w-full h-10 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-xs",
                matchCount === 0 && "opacity-60 pointer-events-none"
              )}
            >
              <span>See matching trains</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Panel (≥1024px) */}
      <aside
        className="hidden lg:block sticky top-6 self-start p-5 rounded-2xl border border-border bg-surface/90 shadow-xs backdrop-blur-xs space-y-4"
        aria-label="Preference match results"
      >
        {ResultsContent}
      </aside>

      {/* Mobile Sticky Bottom Bar & Bottom Sheet (<1024px) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-foreground">
              <span className="font-mono font-bold">{matchCount}</span>{" "}
              {matchCount === 1 ? "train matches" : "trains match"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {bestMatch ? `Best: ${bestMatch.trainName}` : "Adjust preferences"}
            </p>
          </div>

          <Sheet>
            <SheetTrigger className="h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer">
              <span>View results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </SheetTrigger>
            <SheetContent side="bottom" className="p-6 max-h-[85vh] overflow-y-auto rounded-t-2xl">
              <div className="max-w-md mx-auto pt-2">{ResultsContent}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
