"use client";

import type { UserPreferences } from "@/lib/types";
import { cn } from "cn";

interface ChangesSectionProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const CHANGE_OPTIONS: { value: 0 | 1 | 2; label: string; desc: string }[] = [
  { value: 0, label: "Direct only", desc: "No train transfers; single seamless boarding" },
  { value: 1, label: "Up to 1 change", desc: "Allows connecting trains with verified layovers" },
  { value: 2, label: "Up to 2 changes", desc: "Broadest recovery coverage across multi-leg routes" },
];

export function ChangesSection({ preferences, onChange }: ChangesSectionProps) {
  // Guarantee a valid selection (fallback to 1 if undefined or invalid)
  const currentVal =
    preferences.maxChanges === 0
      ? 0
      : preferences.maxChanges === 2
      ? 2
      : 1;

  return (
    <section className="space-y-3 pt-6" aria-labelledby="changes-heading">
      <div>
        <h2 id="changes-heading" className="text-base font-semibold text-foreground">
          Journey Transfers & Changes
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select the maximum number of train changes you are willing to make.
        </p>
      </div>

      <fieldset
        role="radiogroup"
        aria-labelledby="changes-heading"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-0 p-0 m-0"
      >
        <legend className="sr-only">Choose maximum train transfers</legend>
        {CHANGE_OPTIONS.map((opt) => {
          const isSelected = currentVal === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "p-3.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] flex flex-col justify-between select-none",
                "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-surface text-foreground hover:bg-background"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                <input
                  type="radio"
                  name="maxChanges"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => onChange({ maxChanges: opt.value })}
                  className="text-primary focus:ring-primary h-4 w-4"
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{opt.desc}</p>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
