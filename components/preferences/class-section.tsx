"use client";

import { Check } from "lucide-react";
import type { UserPreferences, TravelClass } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";

interface ClassSectionProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const CLASS_TILES: { code: TravelClass; title: string; hint: string }[] = [
  { code: "3A", title: "3A · AC 3-Tier", hint: "Popular AC option" },
  { code: "2A", title: "2A · AC 2-Tier", hint: "Spacious berths & privacy" },
  { code: "1A", title: "1A · First Class AC", hint: "Coupe & lockable cabins" },
  { code: "SL", title: "SL · Sleeper Class", hint: "Economical non-AC berths" },
  { code: "CC", title: "CC · AC Chair Car", hint: "Comfortable daytime travel" },
  { code: "EC", title: "EC · Exec Chair Car", hint: "Premium wide armchairs" },
];

export function ClassSection({ preferences, onChange }: ClassSectionProps) {
  const selectedClasses = preferences.classes;
  const onlyThese = preferences.onlyTheseClasses;

  function handleToggleClass(code: TravelClass) {
    if (selectedClasses.includes(code)) {
      // Prevent zero selected
      if (selectedClasses.length === 1) {
        return; // At least one class must always remain selected
      }
      onChange({
        classes: selectedClasses.filter((c) => c !== code),
      });
    } else {
      onChange({
        classes: [...selectedClasses, code],
      });
    }
  }

  return (
    <section className="space-y-4 pt-6" aria-labelledby="class-heading">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 id="class-heading" className="text-base font-semibold text-foreground">
            Travel Classes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select one or more acceptable accommodation classes. At least one class must be selected.
          </p>
        </div>
      </div>

      {/* 6 Class Tiles Multi-select */}
      <fieldset className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 border-0 p-0 m-0">
        <legend className="sr-only">Choose acceptable train travel classes</legend>
        {CLASS_TILES.map((tile) => {
          const isSelected = selectedClasses.includes(tile.code);
          const isLastRemaining = isSelected && selectedClasses.length === 1;

          return (
            <button
              key={tile.code}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={isLastRemaining}
              onClick={() => handleToggleClass(tile.code)}
              aria-label={`${tile.title}, ${tile.hint}${isLastRemaining ? ", minimum one class required" : ""}`}
              className={cn(
                "p-3 rounded-lg border text-left transition-all duration-150 min-h-[44px] flex flex-col justify-between select-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground font-medium"
                  : "border-border bg-surface text-foreground hover:bg-background",
                isLastRemaining && "cursor-not-allowed opacity-90"
              )}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-semibold text-foreground">{tile.title}</span>
                <span
                  className={cn(
                    "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors shrink-0",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{tile.hint}</p>
            </button>
          );
        })}
      </fieldset>

      {/* Only show these classes Switch */}
      <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-border bg-surface">
        <div className="space-y-0.5">
          <label htmlFor="only-classes-switch" className="text-xs font-semibold text-foreground cursor-pointer">
            Only show these classes
          </label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {onlyThese
              ? "Strict filter: All trains with non-selected classes are excluded."
              : "Ranking preference: Non-selected classes still appear if they arrive sooner or cost less, but are ranked lower."}
          </p>
        </div>

        <Switch
          id="only-classes-switch"
          checked={onlyThese}
          onCheckedChange={(checked) => onChange({ onlyTheseClasses: checked })}
          aria-label="Only show selected classes"
        />
      </div>
    </section>
  );
}
