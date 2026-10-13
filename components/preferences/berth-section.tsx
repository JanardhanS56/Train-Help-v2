"use client";

import { useMemo } from "react";
import type { UserPreferences, BerthPreference } from "@/lib/types";
import { cn } from "cn";

interface BerthSectionProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const BERTH_OPTIONS: { id: BerthPreference; label: string }[] = [
  { id: "no-preference", label: "No preference" },
  { id: "lower", label: "Lower" },
  { id: "middle", label: "Middle" },
  { id: "upper", label: "Upper" },
  { id: "side-lower", label: "Side lower" },
  { id: "side-upper", label: "Side upper" },
];

export function BerthSection({ preferences, onChange }: BerthSectionProps) {
  // Sleeper classes that feature berths
  const hasSleeperClass = useMemo(() => {
    return preferences.classes.some((c) => ["SL", "3A", "2A", "1A"].includes(c));
  }, [preferences.classes]);

  // If only chair car classes (CC, EC) are selected, hide this section
  if (!hasSleeperClass) {
    return null;
  }

  const currentBerth = preferences.berthPreference || "no-preference";

  return (
    <section className="space-y-3 pt-6" aria-labelledby="berth-heading">
      <div>
        <h2 id="berth-heading" className="text-base font-semibold text-foreground">
          Berth Location Preference
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select preferred berth positioning. Berth allocations are always requested, subject to railway charting availability.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="berth-heading"
        className="flex flex-wrap gap-2"
      >
        {BERTH_OPTIONS.map((opt) => {
          const isSelected = currentBerth === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange({ berthPreference: opt.id })}
              className={cn(
                "h-9 px-3.5 rounded-lg border text-xs font-medium transition-colors select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "border-border bg-surface text-foreground hover:bg-background"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Berth requests are used as a final tie-breaker between identically ranked trains. A berth is always requested upon booking and never guaranteed.
      </p>
    </section>
  );
}
