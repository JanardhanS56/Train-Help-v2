"use client";

import { Check } from "lucide-react";
import type { UserPreferences, PresetName, PriorityProfile } from "@/lib/types";
import { PRESETS_CONFIG, detectActivePreset } from "@/lib/constants";
import { cn } from "cn";

interface PresetsSectionProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const PRESET_CARDS: {
  id: Exclude<PresetName, "custom">;
  title: string;
  subtitle: string;
  details: string;
}[] = [
  {
    id: "best-value",
    title: "Best Value",
    subtitle: "Low fare & sleeper options",
    details: "₹2,500 max · SL, 3A · Confirmed or RAC · Direct or 1 change · ±3h flex",
  },
  {
    id: "fastest",
    title: "Fastest",
    subtitle: "Direct journeys prioritized",
    details: "Direct only · ₹6,000 max · Confirmed or RAC · ±1h flex",
  },
  {
    id: "comfort",
    title: "Most Comfortable",
    subtitle: "1A, 2A & Exec premium",
    details: "1A, 2A, EC · Confirmed only · ₹6,000 max · Up to 1 change · ±3h flex",
  },
  {
    id: "confirmed-only",
    title: "Confirmed Seats Only",
    subtitle: "Skip RAC and waitlists",
    details: "Guaranteed berth only · Balanced ranking",
  },
];

const PRIORITY_OPTIONS: { id: PriorityProfile; label: string; desc: string }[] = [
  { id: "balanced", label: "Balanced", desc: "Equal weight across price, time and comfort" },
  { id: "lowest-fare", label: "Lowest Fare", desc: "Prioritize lowest ticket cost" },
  { id: "fastest", label: "Fastest", desc: "Prioritize shortest journey duration" },
  { id: "comfort", label: "Comfort", desc: "Prioritize premium berths and coaches" },
];

export function PresetsSection({ preferences, onChange }: PresetsSectionProps) {
  const activePreset = detectActivePreset(preferences);

  function handleSelectPreset(presetId: Exclude<PresetName, "custom">) {
    const presetDef = PRESETS_CONFIG[presetId];
    onChange({
      ...presetDef.fields,
      preset: presetId,
    });
  }

  function handleSelectPriority(priority: PriorityProfile) {
    const updated: Partial<UserPreferences> = {
      priorityProfile: priority,
    };
    // Re-check preset
    const candidate = { ...preferences, ...updated };
    updated.preset = detectActivePreset(candidate);
    onChange(updated);
  }

  return (
    <section className="space-y-6" aria-labelledby="presets-heading">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="presets-heading" className="text-base font-semibold text-foreground">
            Travel Style Presets
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quick-start profiles calibrated for common rail travel needs.
          </p>
        </div>

        {activePreset === "custom" && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-tint text-foreground border border-border"
            aria-label="Current preset is Custom"
          >
            Custom Settings
          </span>
        )}
      </div>

      {/* 4 Preset Cards */}
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-0 p-0 m-0">
        <legend className="sr-only">Choose a travel style preset</legend>
        {PRESET_CARDS.map((card) => {
          const isSelected = activePreset === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleSelectPreset(card.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative text-left p-3.5 rounded-lg border transition-all duration-150 min-h-[44px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-2 border-primary bg-primary/5 text-foreground shadow-xs"
                  : "border-border bg-surface hover:bg-background text-foreground"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
                </div>
                {isSelected && (
                  <span
                    className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/90 mt-2 font-mono tracking-tight leading-relaxed">
                {card.details}
              </p>
            </button>
          );
        })}
      </fieldset>

      {/* What matters most? Segmented control */}
      <div className="pt-2">
        <label id="priority-label" className="micro-label block mb-2 font-semibold text-foreground">
          WHAT MATTERS MOST?
        </label>
        <div
          role="radiogroup"
          aria-labelledby="priority-label"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-lg bg-muted/60 border border-border"
        >
          {PRIORITY_OPTIONS.map((opt) => {
            const isSelected = preferences.priorityProfile === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectPriority(opt.id)}
                title={opt.desc}
                className={cn(
                  "h-9 px-3 rounded-[6px] text-xs font-medium transition-colors select-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  isSelected
                    ? "bg-surface text-foreground font-semibold shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
